/**
 * yarn global add esbuild tailwindcss clean-css html-minifier js-beautify
 * sudo apt install uglifyjs
 */
import fs from 'fs'
import path from 'path'
import { program } from 'commander'
import { spawn } from 'child_process'
import uglifyjs from 'uglify-js'
import ejs from 'ejs'
import cleancss from 'clean-css'
import htmlMinifier from 'html-minifier'
import jsbeautify from 'js-beautify'
import { fileURLToPath } from 'url'

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
const compileAllJs = async (jsSourceDirPath, jsIgnoreDirPath, action) => {
  const promiseList = []
  for(const dirEntry of fs.readdirSync(jsSourceDirPath, { withFileTypes: true })) {
    if(dirEntry.isDirectory() && jsIgnoreDirPath.indexOf(dirEntry.name) < 0) {
      promiseList.push(action(jsSourceDirPath + dirEntry.name + '/app.js')) 
    }
  }
  await Promise.all(promiseList)
}

const watchAllJs = async (jsSourceDirPath, jsIgnoreDirPath, action) => {
  const promiseList = []
  for(const dirEntry of fs.readdirSync(jsSourceDirPath, { withFileTypes: true })) {
    if(dirEntry.isDirectory()) {
      promiseList.push(watchAllJs(jsSourceDirPath + dirEntry.name + '/', jsIgnoreDirPath, action))
    } else {
      promiseList.push(action(jsSourceDirPath + dirEntry.name)) 
    }
  }
  await Promise.all(promiseList)
}

const compilePageJsHandler = (jsBuildDirPath, isMinifyMode) => {
  return async (filePath) => {
    console.log('buildPageJs:', filePath)
    const appPath = filePath.replace(/^(.*)\/([^\/]*)\/[^\/]*\.js$/g, '$1\/$2\/app.js')
    const buildMinPath = jsBuildDirPath + filePath.replace(/^(.*)\/([^\/]*)\/[^\/]*\.js$/g, '$2') + '/app.js'
    console.log('[info] page script updated:', filePath)
    console.log('[info] new build min script path:', buildMinPath)
    const p = await fork(['esbuild', appPath, '--outfile=' + buildMinPath, '--keep-names', '--bundle'])

    if (isMinifyMode) {
      const minifiedSource = uglifyjs.minify(fs.readFileSync(buildMinPath, 'utf-8'), {})
      fs.writeFileSync(buildMinPath, minifiedSource.code)
    }
    /*
    const minifiedSource = []
    const p2 = await fork(['uglifyjs', '--compress', '--', buildMinPath], minifiedSource)
    fs.writeFileSync(buildMinPath, minifiedSource.join('\n'))
    */
    /*
    const jsBeautified = jsbeautify.js(fs.readFileSync(buildMinPath, 'utf-8'), {})
    fs.writeFileSync(buildMinPath, jsBeautified)
    */
  }
}

const watchPageJsHandler = (regexp, jsSourceDirPath, jsBuildDirPath) => {
  const handle = async (filePath) => {
    const buildJsPath = jsBuildDirPath + filePath.replace(jsSourceDirPath, '')
    console.log('[info] new script filePath:', buildJsPath)
    await awaitSleep(500)
    fs.mkdirSync(path.dirname(buildJsPath), { recursive: true })
    for (let i = 0; i < 3; i++) {
      try {
        fs.copyFileSync(filePath, buildJsPath)
        console.log('[info] copy done:', buildJsPath)
        break
      } catch(e) {
        await awaitSleep(500)
      }
    }
  }
  return (filePath, dirPath) => {
    if (filePath && regexp.test(filePath)) {
      handle(filePath)
    } else if (dirPath) {
      for(const dirEntry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        if(!dirEntry.isDirectory() && regexp.test(dirEntry.name)) {
          handle(dirPath + dirEntry.name)
        }
      }
    }
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

const watchPageEjsHandler = (regexp, ejsConfig, ejsBuildDirPath) => {
  const handle = async (filePath) => {
    console.log('[info] page ejs updated:', filePath)
    const ejsConfigKey = path.basename(filePath).replace(/\.ejs$/, '')
    const ejsPageConfig = Object.assign({}, ejsConfig[ejsConfigKey])
    if(!ejsPageConfig) {
      throw new Error('[error] ejs config undefined: ' + ejsConfigKey)
      return
    }
    Object.assign(ejsPageConfig, ejsConfig._common)
    Object.assign(ejsPageConfig, { isProduction: false, })
    for (let i = 0; i < 3; i++) {
      try {
        const htmlContent = await ejs.render(fs.readFileSync(filePath, 'utf-8'), ejsPageConfig)
        const buildHtmlPath = ejsBuildDirPath + path.basename(filePath).replace(/\.ejs$/, '.html')
        fs.writeFileSync(buildHtmlPath, htmlContent)
        console.log('[info] render done:', buildHtmlPath)
        break
      } catch(e) {
        await awaitSleep(300)
      }
    }
  }

  return (filePath, dirPath) => {
    if (filePath && regexp.test(filePath)) {
      handle(filePath)
    } else {
      for(const dirEntry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        if(!dirEntry.isDirectory()) {
          handle(dirPath + dirEntry.name)
        }
      }
    }
  }
}

const watchComponentEjsHandler = (ejsSourceDirPath, ejsConfig, ejsBuildDirPath) => {
  return async () => {
    await awaitSleep(1000)
    buildAllEjs(ejsSourceDirPath, watchPageEjsHandler(/\.ejs$/, ejsConfig, ejsBuildDirPath)) 
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

const compilePageCssHandler = (cssBuildDirPath, tailwindcssConfigPath, tailwindcssFilePath) => {
  return async (filePath) => {
    const buildCssPath = cssBuildDirPath + path.basename(filePath)
    if(filePath.indexOf(tailwindcssFilePath) === (filePath.length - tailwindcssFilePath.length)) {
      console.log('[info] new tailwindcss filePath:', buildCssPath)
      const p = await fork(['NODE_ENV=production', 'tailwindcss', 'build', '-c', tailwindcssConfigPath, '-i', filePath, '-o', buildCssPath])
    } else {
      console.log('[info] new css filePath:', buildCssPath)
      fs.mkdirSync(path.dirname(buildCssPath), { recursive: true })
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

const watchPageCssHandler = (regexp, cssBuildDirPath, tailwindcssConfigPath, tailwindcssFilePath) => {
  const handle = async (filePath) => {
    const buildCssPath = cssBuildDirPath + path.basename(filePath)
    if(filePath.indexOf(tailwindcssFilePath) === (filePath.length - tailwindcssFilePath.length)) {
      console.log('[info] new tailwindcss filePath:', buildCssPath)
      const p = await fork(['NODE_ENV=dev', 'tailwindcss', 'build', '-c', tailwindcssConfigPath, '-i', filePath, '-o', buildCssPath])
    } else {
      console.log('[info] new css filePath:', buildCssPath)
      fs.mkdirSync(path.dirname(buildCssPath), { recursive: true })
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

  return (filePath, dirPath) => {
    if (filePath && regexp.test(filePath)) {
      handle(filePath)
    } else {
      for(const dirEntry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        if(!dirEntry.isDirectory()) {
          handle(dirPath + dirEntry.name)
        }
      }
    }
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

const startWatcher = (watchPath, action) => {
  let isDirectory = false
  let isLock = false
  if (fs.statSync(watchPath).isDirectory()) {
    isDirectory = true
    fs.readdirSync(watchPath, { withFileTypes: true, })
      .filter((ent) => { return ent.isDirectory() })
      .forEach((subDirEnt) => {
        startWatcher(`${watchPath}${subDirEnt.name}/`, action)
      })
  }
  fs.watch(watchPath, {}, async (event, fileName) => {
    await awaitSleep(Math.random() * 1000)
    if (isLock || event !== 'change') {
      return
    }

    isLock = true
    console.log({ watchPath, event, fileName })
    let filePath = watchPath 
    if (isDirectory) {
      filePath += fileName
    }
    if (!cacheForWatch[filePath] || cacheForWatch[filePath] < Date.now()) {
      console.log('action:', watchPath, filePath)
      cacheForWatch[filePath] = Date.now() + 2000
      action(filePath, watchPath)
    }

    if (!isDirectory) {
      startWatcher(watchPath, action)
    }
    await awaitSleep(1000)
    isLock = false
  })
}

/* main */
const main = async () => {
  program
    .option('--command <command>', '"compile", "watch"', 'compile')
    .option('--js <path>', 'browser js source folder path', './view/src/js/')
    .option('--css <path>', 'browser css source folder path', './view/src/css/')
    .option('--ejs <path>', 'browser ejs source folder path', './view/src/ejs/page/')
    .option('--ejs-component <path>', 'browser ejs source folder path', './view/src/ejs/component/')
    .option('--out <path>', 'browser js destitaion folder path', './view/build/')
    .option('--tailwindcss-config <path>', 'tailwind.config.js file path', './view/src/config/tailwind.config.cjs')
    .option('--tailwindcss-file <path>', 'tailwind.css file path', './view/src/css/tailwind.css')
    .option('--ejs-config <path>', 'ejs.config.js file path', '../../../view/src/config/ejs.config.js')
    .option('--minify', 'minify or not', false)
    .option('--js-ignore <folderName>,<folderName>', 'ignore folder in browser js source folder', '_setting,_lib')
  program.parse()

  const argList = program.opts()
  console.log(argList)

  const jsSourceDirPath = argList.js 
  const cssSourceDirPath = argList.css 
  const ejsSourceDirPath = argList.ejs 
  const ejsComponentSourceDirPath = argList.ejsComponent 
  const buildDirPath = argList.out 
  const tailwindcssConfigPath = argList.tailwindcssConfig 
  const tailwindcssFilePath = argList.tailwindcssFile 
  const isMinifyMode = argList.minify
  const command = argList.command
  const jsIgnoreDirPath = argList.jsIgnore.split(',').filter((row) => { return row !== '' })
  const configFilePath = argList.ejsConfig 

  const jsBuildDirPath = buildDirPath + 'js/'
  const cssBuildDirPath = buildDirPath + 'css/'
  const ejsBuildDirPath = buildDirPath
  const ejsConfig = (await import(configFilePath)).ejsConfig

  if (command === 'compile') {
    removeBuildDir(jsBuildDirPath, cssBuildDirPath, ejsBuildDirPath)
    await compileAllJs(jsSourceDirPath, jsIgnoreDirPath, compilePageJsHandler(jsBuildDirPath, isMinifyMode))
    await buildAllEjs(ejsSourceDirPath, watchPageEjsHandler(/\.ejs$/, ejsConfig, ejsBuildDirPath))
    await buildAllCss(cssSourceDirPath, compilePageCssHandler(cssBuildDirPath, tailwindcssConfigPath, tailwindcssFilePath))
    await buildAllEjs(ejsSourceDirPath, compilePageEjsHandler(ejsConfig, ejsBuildDirPath, isMinifyMode))
  }

  if (command === 'watch') {
    await watchAllJs(jsSourceDirPath, jsIgnoreDirPath, watchPageJsHandler(/\.js$/, jsSourceDirPath, jsBuildDirPath))
    await buildAllCss(cssSourceDirPath, watchPageCssHandler(/\.css$/, cssBuildDirPath, tailwindcssConfigPath, tailwindcssFilePath))
    await buildAllEjs(ejsSourceDirPath, watchPageEjsHandler(/\.ejs$/, ejsConfig, ejsBuildDirPath))

    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    startWatcher(jsSourceDirPath, watchPageJsHandler(/\.js$/, jsSourceDirPath, jsBuildDirPath))
    startWatcher(cssSourceDirPath, watchPageCssHandler(/\.css$/, cssBuildDirPath, tailwindcssConfigPath, tailwindcssFilePath))
    startWatcher(ejsSourceDirPath, watchPageEjsHandler(/\.ejs$/, ejsConfig, ejsBuildDirPath))
    startWatcher(ejsComponentSourceDirPath, watchComponentEjsHandler(ejsSourceDirPath, ejsConfig, ejsBuildDirPath))
    startWatcher(__dirname + '/' + configFilePath, /\.(js|ts)$/, watchEjsConfigHandler())
  }
}

main()

