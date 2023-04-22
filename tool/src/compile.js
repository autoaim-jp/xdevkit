/**
 * yarn global add esbuild tailwindcss clean-css html-minifier js-beautify
 * sudo apt install uglifyjs
 */
import fs from 'fs'
import path from 'path'
import { program } from 'commander'
import { spawn } from 'child_process'
// import uglifyjs from 'uglify-js'
import ejs from 'ejs'
import cleancss from 'clean-css'
import htmlMinifier from 'html-minifier'
import jsbeautify from 'js-beautify'

const cacheForWatch = {}

/* lib */
const fork = (command, list = []) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command[0], command.slice(1), { shell: true, })
    console.log('start:', command)

    proc.stderr.on('data', (err) => {
      console.error('stderr:', err.toString())
    })
    proc.stdout.on('data', (data) => {
      console.log('stdout:', data.toString())
      const result = ((data || '').toString() || '').slice(0, -1).split(',')
      list.push(result)
    })
    proc.on('close', (code) => {
      console.log('[end] spawn', code)
      resolve()
    })
  })
}

const awaitSleep = (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/* common */
const removeBuildDir = (jsBuildDirPath, cssBuildDirPath, ejsBuildDirPath) => {
  try {
    fs.emptyDirSync(jsBuildDirPath)
    console.log('[info] remove dir:', jsBuildDirPath)
    fs.mkdirSync(jsBuildDirPath)
  } catch(e) {
    console.log('[info] dir is empty:', jsBuildDirPath)
  }
  try {
    fs.emptyDirSync(cssBuildDirPath)
    console.log('[info] remove dir:', cssBuildDirPath)
    fs.mkdirSync(cssBuildDirPath)
  } catch(e) {
    console.log('[info] dir is empty:', cssBuildDirPath)
  }
  try {
    fs.emptyDirSync(ejsBuildDirPath)
    console.log('[info] remove dir:', ejsBuildDirPath)
    fs.mkdirSync(ejsBuildDirPath)
  } catch(e) {
    console.log('[info] dir is empty:', ejsBuildDirPath)
  }
}

/* js */
const buildAllJs = async (jsSourceDirPath, jsIgnoreDirPath, action) => {
  const promiseList = []
  for(const dirEntry of fs.readdirSync(jsSourceDirPath, { withFileTypes: true })) {
    if(dirEntry.isDirectory() && jsIgnoreDirPath.indexOf(dirEntry.name) < 0) {
      promiseList.push(action(jsSourceDirPath + dirEntry.name + '/app.js')) }
  }
  await Promise.all(promiseList)
}

const compilePageJsHandler = (jsBuildDirPath) => {
  return async (filePath) => {
    console.log('buildPageJs:', filePath)
    const appPath = filePath.replace(/^(.*)\/([^\/]*)\/[^\/]*\.js$/g, '$1\/$2\/app.js')
    const buildMinPath = jsBuildDirPath + filePath.replace(/^(.*)\/([^\/]*)\/[^\/]*\.js$/g, '$2') + '/app.js'
    console.log('[info] page script updated:', filePath)
    console.log('[info] new build min script path:', buildMinPath)
    const p = await fork(['esbuild', appPath, '--outfile=' + buildMinPath, '--bundle'])

    /*
  const minifiedSource = uglifyjs.minify(fs.readFileSync(buildMinPath, 'utf-8'))
  fs.writeFileSync(buildMinPath, minifiedSource.code)
  */
    /*
  const minifiedSource = []
  const p2 = await fork(['uglifyjs', '--compress', '--', buildMinPath], minifiedSource)
  fs.writeFileSync(buildMinPath, minifiedSource.join('\n'))
  */
    const jsBeautified = jsbeautify.js(fs.readFileSync(buildMinPath, 'utf-8'), {})
    fs.writeFileSync(buildMinPath, jsBeautified)
  }
}

const watchPageJsHandler = (jsSourceDirPath, jsBuildDirPath) => {
  return (filePath) => {
    const buildJsPath = jsBuildDirPath + filePath.replace(jsSourceDirPath, '')
    console.log('[info] new script filePath:', buildJsPath)
    setTimeout(() => {
      fs.copyFileSync(filePath, buildJsPath)
    }, 300) 
  }
}


/* ejs */
const buildAllEjs = async (ejsSourceDirPath, action) => {
  const promiseList = []
  for(const dirEntry of fs.readdirSync(ejsSourceDirPath, { withFileTypes: true })) {
    promiseList.push(action(ejsSourceDirPath + dirEntry.name))
  }
  await Promise.all(promiseList)
}

const compilePageEjsHandler = (ejsConfig, ejsBuildDirPath, isMinifyMode) => {
  return async (filePath) => {
    console.log('[info] page ejs updated:', filePath)
    const ejsConfigKey = path.basename(filePath).replace(/\.ejs$/, '')
    const ejsPageConfig = Object.assign({}, ejsConfig[ejsConfigKey])
    if(!ejsPageConfig) {
      throw new Error('[error] ejs config undefined: ' + ejsConfigKey)
      return
    }
    Object.assign(ejsPageConfig, ejsConfig._common)
    Object.assign(ejsPageConfig, { isProduction: true, })
    if(ejsPageConfig.inlineScriptList) {
      for(const [i, inlineJsPath] of Object.entries(ejsPageConfig.inlineScriptList)) {
        const scriptFilePath = ejsBuildDirPath + inlineJsPath
        try {
          ejsPageConfig.inlineScriptList[i] = await fs.readFileSync(scriptFilePath, 'utf-8')
        } catch(e) {
          throw new Error('[error] script file not exists: ' + scriptFilePath)
        }
      }
    }
    if(ejsPageConfig.inlineCssList) {
      for(const [i, inlineCssPath] of Object.entries(ejsPageConfig.inlineCssList)) {
        const cssFilePath = ejsBuildDirPath + inlineCssPath
        try {
          ejsPageConfig.inlineCssList[i] = await fs.readFileSync(cssFilePath, 'utf-8')
        } catch(e) {
          throw new Error('[error] css file not exists: ' + cssFilePath)
        }
      }
    }

    const htmlContent = await ejs.render(fs.readFileSync(filePath, 'utf-8'), ejsPageConfig)
    const buildHtmlPath = ejsBuildDirPath + path.basename(filePath).replace(/\.ejs$/, '.html')
    fs.writeFileSync(buildHtmlPath, htmlContent)

    if(isMinifyMode) {
      const htmlMinified = htmlMinifier.minify(fs.readFileSync(buildHtmlPath, 'utf-8'), {
        collapseWhitespace: true,
        removeComments: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeTagWhitespace: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: false, // to prevent error
      })
      fs.writeFileSync(buildHtmlPath, htmlMinified)
      /*
    const htmlMinified = []
    const p = await fork(['html-minifier', '--collapse-whitespace', '--remove-comments', '--remove-optional-tags', '--remove-redundant-attributes', '--remove-script-type-attributes', '--remove-tag-whitespace', '--use-short-doctype', '--minify-css', 'true', '--minify-js', 'true', buildHtmlPath], htmlMinified)
    fs.writeFileSync(buildHtmlPath, htmlMinified.join('\n'))
    */
    } else {
      const htmlBeautified = jsbeautify.html(fs.readFileSync(buildHtmlPath, 'utf-8'), {
        preserve_newlines: false,
        max_preserve_newlines: 0,
        wrap_line_length: 0,
        wrap_attributes_indent_size: 0,
        unformatted: 'style,script,pre'
      })
      fs.writeFileSync(buildHtmlPath, htmlBeautified)
      /*
    const p = await fork(['js-beautify', buildHtmlPath, '-r', '--preserve-new-lines', 'false', '--max-preserve-newlines', '0', '--wrap-line-length', '0', '--wrap-attributes-indent-size', '0', '--unformatted', 'style', '--unformatted', 'script', '--unformatted', 'pre'])
    */
    }
  }
}

const watchPageEjsHandler = (ejsConfig, ejsBuildDirPath) => {
  return async (filePath) => {
    console.log('[info] page ejs updated:', filePath)
    const ejsConfigKey = path.basename(filePath).replace(/\.ejs$/, '')
    const ejsPageConfig = Object.assign({}, ejsConfig[ejsConfigKey])
    if(!ejsPageConfig) {
      throw new Error('[error] ejs config undefined: ' + ejsConfigKey)
      return
    }
    Object.assign(ejsPageConfig, ejsConfig._common)
    Object.assign(ejsPageConfig, { isProduction: false, })
    const htmlContent = await ejs.render(fs.readFileSync(filePath, 'utf-8'), ejsPageConfig)
    const buildHtmlPath = ejsBuildDirPath + path.basename(filePath).replace(/\.ejs$/, '.html')
    fs.writeFileSync(buildHtmlPath, htmlContent)
  }
}


/* css */
const buildAllCss = async (cssSourceDirPath, action) => {
  const promiseList = []
  for(const dirEntry of fs.readdirSync(cssSourceDirPath, { withFileTypes: true })) {
    promiseList.push(action(cssSourceDirPath + dirEntry.name))
  }
  await Promise.all(promiseList)
}

const compilePageCssHandler = (cssBuildDirPath, tailwindConfigPath, tailwindCssPath) => {
  return async (filePath) => {
    const buildCssPath = cssBuildDirPath + path.basename(filePath)
    if(filePath.indexOf(tailwindCssPath) === (filePath.length - tailwindCssPath.length)) {
      console.log('[info] new tailwindcss filePath:', buildCssPath)
      const p = await fork(['NODE_ENV=production', 'tailwindcss', 'build', '-c', tailwindConfigPath, '-i', filePath, '-o', buildCssPath])
    } else {
      console.log('[info] new css filePath:', buildCssPath)
      fs.copyFileSync(filePath, buildCssPath)
    }

    const cssMinified = new cleancss().minify(fs.readFileSync(buildCssPath))
    fs.writeFileSync(buildCssPath, cssMinified.styles)
    /*
  const cssMinified = []
  const p2 = await fork(['cleancss', buildCssPath], cssMinified)
  fs.writeFileSync(buildCssPath, cssMinified.join('\n'))
  */
  }
}

const watchPageCssHandler = (cssBuildDirPath, tailwindConfigPath, tailwindCssPath) => {
  return async (filePath) => {
    const buildCssPath = cssBuildDirPath + path.basename(filePath)
    if(filePath.indexOf(tailwindCssPath) === (filePath.length - tailwindCssPath.length)) {
      console.log('[info] new tailwindcss filePath:', buildCssPath)
      const p = await fork(['NODE_ENV=dev', 'tailwindcss', 'build', '-c', tailwindConfigPath, '-i', filePath, '-o', buildCssPath])
    } else {
      console.log('[info] new css filePath:', buildCssPath)
      fs.copyFileSync(filePath, buildCssPath)
    }

    const cssMinified = new cleancss().minify(fs.readFileSync(buildCssPath))
    fs.writeFileSync(buildCssPath, cssMinified.styles)
    /*
  const cssMinified = []
  const p2 = await fork(['cleancss', buildCssPath], cssMinified)
  fs.writeFileSync(buildCssPath, cssMinified.join('\n'))
  */
  }
}

/* watch */
const watchEjsConfigHandler = () => {
  return (filePath) => {
    console.log('==================================================')
    console.log('[info] ejs file updated:', filePath)
    console.log('Please re run watch command.')
    console.log('==================================================')
  }
}

const startWatcher = (watchPath, regActionList) => {
  let isDirectory = false
  let isLock = false
  if (fs.statSync(watchPath).isDirectory()) {
    isDirectory = true
    fs.readdirSync(watchPath, { withFileTypes: true, })
      .filter((ent) => { return ent.isDirectory() })
      .forEach((subDirEnt) => {
        startWatcher(`${watchPath}${subDirEnt.name}/`, regActionList)
      })
  }
  fs.watch(watchPath, {}, async (event, fileName) => {
    await awaitSleep(Math.random() * 1000)
    if (isLock || event !== 'change' || fileName === '4193') {
      return
    }

    isLock = true
    console.log({ watchPath, event, fileName })
    regActionList.forEach((row) => {
      let filePath = watchPath 
      if (isDirectory) {
        filePath += fileName
      }
      if(row.regexp.test(filePath) && (!cacheForWatch[filePath] || cacheForWatch[filePath] < Date.now())) {
        console.log('action:', watchPath, row.regexp)
        cacheForWatch[filePath] = Date.now() + 2000
        row.action(filePath)
      }
    })

    if (!isDirectory) {
      startWatcher(watchPath, regActionList)
    }
    await awaitSleep(1000)
    isLock = false
  })
}

/* main */
const main = async () => {
  program
    .option('--command <command>', '"compile", "watch", "watch"', './custom/public/src/js/')
    .option('--js <path>', 'browser js source folder path', './custom/public/src/js/')
    .option('--css <path>', 'browser css source folder path', './custom/public/src/css/')
    .option('--ejs <path>', 'browser ejs source folder path', './custom/public/src/ejs/')
    .option('--out <path>', 'browser js destitaion folder path', './custom/public/build/')
    .option('--tailwindconfig <path>', 'tailwind.config.js file path', './custom/tailwind.config.js')
    .option('--tailwindcss <path>', 'tailwind.css file path', './custom/tailwind.css')
    .option('--ejsconfig <path>', 'ejs.config.js file path', './custom/ejs.config.js')
    .option('--minify', 'minify or not', false)
    .option('--js-ignore <folderName>,<folderName>', 'ignore folder in browser js source folder', '_setting,_common,_xdevkit')
  program.parse()

  const argList = program.opts()
  console.log(argList)

  const jsSourceDirPath = argList.js 
  const cssSourceDirPath = argList.css 
  const ejsSourceDirPath = argList.ejs 
  const buildDirPath = argList.out 
  const tailwindConfigPath = argList.tailwindconfig 
  const tailwindCssPath = argList.tailwindcss 
  const isMinifyMode = argList.minify
  const command = argList.command
  const jsIgnoreDirPath = argList.jsIgnore.split(',').filter((row) => { return row !== '' })
  const configFilePath = argList.ejsconfig 

  const jsBuildDirPath = buildDirPath + 'js/'
  const cssBuildDirPath = buildDirPath + 'css/'
  const ejsBuildDirPath = buildDirPath
  const ejsConfig = (await import(configFilePath)).ejsConfig

  if (command === 'compile') {
    removeBuildDir(jsBuildDirPath, cssBuildDirPath, ejsBuildDirPath)
    await buildAllJs(jsSourceDirPath, jsIgnoreDirPath, compilePageJsHandler(jsBuildDirPath))
    await buildAllEjs(ejsSourceDirPath, ejsConfig, ejsBuildDirPath, false, watchPageEjsHandler(ejsConfig, ejsBuildDirPath))
    await buildAllCss(cssSourceDirPath, compilePageCssHandler(cssBuildDirPath, tailwindConfigPath, tailwindCssPath))
    await buildAllEjs(ejsSourceDirPath, compilePageEjsHandler(ejsConfig, ejsBuildDirPath, isMinifyMode))
  }

  if (command === 'watch') {
    await buildAllJs(jsSourceDirPath, jsIgnoreDirPath, watchPageJsHandler(jsSourceDirPath, jsBuildDirPath))
    await buildAllCss(cssSourceDirPath, watchPageCssHandler(cssBuildDirPath, tailwindConfigPath, tailwindCssPath))
    await buildAllEjs(ejsSourceDirPath, watchPageEjsHandler(ejsConfig, ejsBuildDirPath))

    startWatcher(jsSourceDirPath, [
      { regexp: /\.js$/, action: watchPageJsHandler(jsSourceDirPath, jsBuildDirPath), },
    ])
    startWatcher(cssSourceDirPath, [
      { regexp: /\.css$/, action: watchPageCssHandler(cssBuildDirPath, tailwindConfigPath, tailwindCssPath), },
    ])
    startWatcher(ejsSourceDirPath, [
      { regexp: /\.ejs$/, action: watchPageEjsHandler(ejsConfig, ejsBuildDirPath), },
    ])
    startWatcher(configFilePath, [
      { regexp: /\.(js|ts)$/, action: watchEjsConfigHandler(), },
    ])
  }
}

main()

