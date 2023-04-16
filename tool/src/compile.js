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

/* common */
const removeBuildDir = (JS_PATH_OUT, CSS_PATH_OUT, EJS_PATH_OUT) => {
  try {
    fs.emptyDirSync(JS_PATH_OUT)
    console.log('[info] remove dir:', JS_PATH_OUT)
    fs.mkdirSync(JS_PATH_OUT)
  } catch(e) {
    console.log('[info] dir is empty:', JS_PATH_OUT)
  }
  try {
    fs.emptyDirSync(CSS_PATH_OUT)
    console.log('[info] remove dir:', CSS_PATH_OUT)
    fs.mkdirSync(CSS_PATH_OUT)
  } catch(e) {
    console.log('[info] dir is empty:', CSS_PATH_OUT)
  }
  try {
		fs.emptyDirSync(EJS_PATH_OUT)
    console.log('[info] remove dir:', EJS_PATH_OUT)
    fs.mkdirSync(EJS_PATH_OUT)
  } catch(e) {
    console.log('[info] dir is empty:', EJS_PATH_OUT)
  }
}

/* js */
const buildAllJs = async (JS_PATH_IN, JS_PATH_OUT, IGNORE_SRC_JS_DIR_LIST) => {
  const promiseList = []
	for(const dirEntry of fs.readdirSync(JS_PATH_IN, { withFileTypes: true })) {
    if(dirEntry.isDirectory() && IGNORE_SRC_JS_DIR_LIST.indexOf(dirEntry.name) < 0) {
      promiseList.push(buildPageJs(JS_PATH_IN + dirEntry.name + '/app.js', JS_PATH_OUT)) }
  }
  await Promise.all(promiseList)
}

const buildPageJs = async (filePath, JS_PATH_OUT) => {
  console.log('buildPageJs:', filePath)
  const appPath = filePath.replace(/^(.*)\/([^\/]*)\/[^\/]*\.js$/g, '$1\/$2\/app.js')
  const buildMinPath = JS_PATH_OUT + filePath.replace(/^(.*)\/([^\/]*)\/[^\/]*\.js$/g, '$2') + '/app.js'
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


/* ejs */
const buildAllEjsForTailwind = async (EJS_PATH_IN, ejsConfig, EJS_PATH_OUT) => {
  const promiseList = []
	for(const dirEntry of fs.readdirSync(EJS_PATH_IN, { withFileTypes: true })) {
    promiseList.push(buildPageEjsForTailwind(EJS_PATH_IN + dirEntry.name, ejsConfig, EJS_PATH_OUT))
  }
  await Promise.all(promiseList)
}

const buildAllEjs = async (EJS_PATH_IN, ejsConfig, EJS_PATH_OUT, MINIFY_HTML) => {
  const promiseList = []
	for(const dirEntry of fs.readdirSync(EJS_PATH_IN, { withFileTypes: true })) {
    promiseList.push(buildPageEjs(EJS_PATH_IN + dirEntry.name, ejsConfig, EJS_PATH_OUT, MINIFY_HTML))
  }
  await Promise.all(promiseList)
}

const buildPageEjsForTailwind = async (filePath, ejsConfig, EJS_PATH_OUT) => {
  console.log('[info] page ejs updated:', filePath)
  const ejsConfigKey = path.basename(filePath).replace(/\.ejs$/, '')
  const ejsPageConfig = ejsConfig[ejsConfigKey]
  if(!ejsPageConfig) {
    throw new Error('[error] ejs config undefined: ' + ejsConfigKey)
    return
  }
  Object.assign(ejsPageConfig, ejsConfig._common)
  Object.assign(ejsPageConfig, { isProduction: false, })
  const htmlContent = await ejs.render(fs.readFileSync(filePath, 'utf-8'), ejsPageConfig)
  const buildHtmlPath = EJS_PATH_OUT + path.basename(filePath).replace(/\.ejs$/, '.html')
  fs.writeFileSync(buildHtmlPath, htmlContent)
}

const buildPageEjs = async (filePath, ejsConfig, EJS_PATH_OUT, MINIFY_HTML) => {
  console.log('[info] page ejs updated:', filePath)
  const ejsConfigKey = path.basename(filePath).replace(/\.ejs$/, '')
  const ejsPageConfig = ejsConfig[ejsConfigKey]
  if(!ejsPageConfig) {
    throw new Error('[error] ejs config undefined: ' + ejsConfigKey)
    return
  }
  Object.assign(ejsPageConfig, ejsConfig._common)
  Object.assign(ejsPageConfig, { isProduction: true, })
  if(ejsPageConfig.inlineScriptList) {
    for(const [i, inlineJsPath] of Object.entries(ejsPageConfig.inlineScriptList)) {
      const scriptFilePath = EJS_PATH_OUT + inlineJsPath
      try {
        ejsPageConfig.inlineScriptList[i] = await fs.readFileSync(scriptFilePath, 'utf-8')
      } catch(e) {
        throw new Error('[error] script file not exists: ' + scriptFilePath)
      }
    }
  }
  if(ejsPageConfig.inlineCssList) {
    for(const [i, inlineCssPath] of Object.entries(ejsPageConfig.inlineCssList)) {
      const cssFilePath = EJS_PATH_OUT + inlineCssPath
      try {
        ejsPageConfig.inlineCssList[i] = await fs.readFileSync(cssFilePath, 'utf-8')
      } catch(e) {
        throw new Error('[error] css file not exists: ' + cssFilePath)
      }
    }
  }

  const htmlContent = await ejs.render(fs.readFileSync(filePath, 'utf-8'), ejsPageConfig)
  const buildHtmlPath = EJS_PATH_OUT + path.basename(filePath).replace(/\.ejs$/, '.html')
  fs.writeFileSync(buildHtmlPath, htmlContent)

  if(MINIFY_HTML) {
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


/* css */
const buildAllCss = async (CSS_PATH_IN, CSS_PATH_OUT, TAILWIND_CONFIG, TAILWIND_CSS_PATH) => {
  const promiseList = []
	for(const dirEntry of fs.readdirSync(CSS_PATH_IN, { withFileTypes: true })) {
    promiseList.push(buildPageCss(CSS_PATH_IN + dirEntry.name, CSS_PATH_OUT, TAILWIND_CONFIG, TAILWIND_CSS_PATH))
  }
  await Promise.all(promiseList)
}

const buildPageCss = async (filePath, CSS_PATH_OUT, TAILWIND_CONFIG, TAILWIND_CSS_PATH) => {
  const buildCssPath = CSS_PATH_OUT + path.basename(filePath)
  if(filePath.indexOf(TAILWIND_CSS_PATH) === (filePath.length - TAILWIND_CSS_PATH.length)) {
    console.log('[info] new tailwindcss filePath:', buildCssPath)
    const p = await fork(['NODE_ENV=production', 'tailwindcss', 'build', '-c', TAILWIND_CONFIG, '-i', filePath, '-o', buildCssPath])
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


/* main */
const main = async () => {
	let ejsConfig = {}
	let JS_PATH_IN = ''
	let CSS_PATH_IN = ''
	let EJS_PATH_IN = ''
	let BUILD_DIR = ''
	let JS_PATH_OUT = ''
	let CSS_PATH_OUT = ''
	let EJS_PATH_OUT = ''
	let TAILWIND_CONFIG = ''
	let TAILWIND_CSS_PATH = ''
	let MINIFY_HTML = false
	let IGNORE_SRC_JS_DIR_LIST = null

	program
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

	JS_PATH_IN = argList.js 
	CSS_PATH_IN = argList.css 
	EJS_PATH_IN = argList.ejs 
	BUILD_DIR = argList.out 
	TAILWIND_CONFIG = argList.tailwindconfig 
	TAILWIND_CSS_PATH = argList.tailwindcss 
	MINIFY_HTML = argList.minify
	IGNORE_SRC_JS_DIR_LIST = argList.jsIgnore.split(',').filter((row) => { return row !== '' })
	const configFilePath = argList.ejsconfig 

	JS_PATH_OUT = BUILD_DIR + 'js/'
	CSS_PATH_OUT = BUILD_DIR + 'css/'
	EJS_PATH_OUT = BUILD_DIR
	ejsConfig = (await import(configFilePath)).ejsConfig
	console.log(ejsConfig)

	removeBuildDir(JS_PATH_OUT, CSS_PATH_OUT, EJS_PATH_OUT)
	await buildAllJs(JS_PATH_IN, JS_PATH_OUT, IGNORE_SRC_JS_DIR_LIST)
	await buildAllEjsForTailwind(EJS_PATH_IN, ejsConfig, EJS_PATH_OUT)
	await buildAllCss(CSS_PATH_IN, CSS_PATH_OUT, TAILWIND_CONFIG, TAILWIND_CSS_PATH)
	await buildAllEjs(EJS_PATH_IN, ejsConfig, EJS_PATH_OUT, MINIFY_HTML)
}

main()

