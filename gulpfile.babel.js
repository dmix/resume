// =================================================
// Directories
// =================================================

import gulp from 'gulp'
import plugins from 'gulp-load-plugins'
const _ = plugins()

import gulpsmith from 'gulpsmith'
import layouts from 'metalsmith-layouts'
import collections from 'metalsmith-collections'
import templates from 'metalsmith-in-place'
import assign from 'lodash.assign'
import markdown from 'metalsmith-markdown'
import permalinks from 'metalsmith-permalinks'
import dateFormatter from 'metalsmith-date-formatter'
import data from 'metalsmith-data'
import dataLoader from 'metalsmith-data-loader'

import log from 'fancy-log'
import harmonize from 'harmonize'
import superstatic from 'superstatic'

// Directories
// -------------------------------------------------

const jsVendor = [
    'assets/vendor/js/*.js',
    'assets/vendor/js/**/*.js',
]

const jsSource = [
    'assets/js/*.js',
    'assets/js/**/*.js',
]

const htmlWatchSource = [
    'src/*.html',
    'src/partials/*.html',
    'src/layouts/*.html',
    'src/homepage/*.html',
    'src/blog_posts/*.md',
]

const htmlSource = [
    'src/*.html',
    'src/homepage/*.html',
    'src/blog_posts/*.md',
]

const blogSource = 'src/blog_posts/*.md'

const cssVendor = [
    'node_modules/foundation-sites/scss',
    'node_modules/motion-ui/src',
    'assets/vendor/css',
]

const cssWatchSource = [
    'assets/css/*.scss',
    'assets/css/**/*.scss',
]

const cssSource = [
    'assets/css/app.scss',
]

const imgSource = [
    // 'src/assets/images#<{(|.png',
    // 'src/assets/images#<{(|.jpg',
    // 'src/assets/images#<{(|.jpeg',
    // 'src/assets/images#<{(|.gif',
    'assets/images/*',
    'assets/images/**',
]

const fontSource = [
    'assets/fonts/*',
]

const output = './build/'
harmonize() // Fixes issues with gulpsmith


// Javascript
// -------------------------------------------------

gulp.task('jslib', () => {
    return gulp.src(jsVendor)
        .pipe(_.concat('lib.js'))
        .pipe(gulp.dest(output + '/js'))
        .pipe(_.size({title: 'js'}))
})

gulp.task('js', () => {
    return gulp.src(jsSource)
        .pipe(_.concat('app.js'))
        .pipe(_.babelMinify({
            mangle: {
                keepClassName: true
            }
        }))
        .on('error', handleError)
        .pipe(gulp.dest(output + '/js'))
        .pipe(_.size({title: 'js'}))
})


// HTML
// -------------------------------------------------

gulp.task('html', () => {
    return gulp.src(htmlSource)
        .pipe(_.frontMatter()).on('data', function(file) {
            assign(file, file.frontMatter)
            delete file.frontMatter
        })
        .pipe(
            gulpsmith()
                .use(dataLoader({
                    dataProperty: 'content',
                    directory: 'content/',
                    match: '**/*',
                    matchOptions: {},
                    removeSource: false
                }))
                .use(collections({
                    blog_posts: {
                        pattern: 'blog_posts/*.md',
                        sortBy: 'date',
                    }
                }))
                .use(templates({
                    engine: 'nunjucks',
                    partials: 'src/partials',
                    partialExtension: '.html',
                    pattern: '**/*.html',
                }))
        )
        .on('error', handleError)
        .pipe(gulp.dest(output))
        // .pipe(_.htmlMinifier({collapseWhitespace: true}))
})

// Blog
// -------------------------------------------------

gulp.task('blog', () => {
    return gulp.src(blogSource)
        .pipe(_.frontMatter()).on("data", function(file) {
            assign(file, file.frontMatter)
            delete file.frontMatter
        })
        .pipe(
            gulpsmith()
                .use(dateFormatter({
                    dates: [
                        {
                            key: 'date',
                            format: 'MMMM Do, YYYY'
                        }
                    ]
                }))
                .use(markdown({
                    smartypants: true
                }))
                .use(layouts({
                    directory: 'src/layouts',
                    engine: 'handlebars',
                    partials: 'src/partials',
                    default: 'blog.html'
                }))
                .use(permalinks(':permalink'))
        )
        .pipe(gulp.dest(output))
})

// CSS
// -------------------------------------------------

gulp.task('css', () => {
    return gulp.src(cssSource)
        .pipe(_.sass({
            includePaths: cssVendor,
            outputStyle: 'compressed' // if css compressed **file size**
        })
        .on('error', _.sass.logError))
        .pipe(_.autoprefixer({
            browsers: ['last 2 versions', 'ie >= 10']
        }))
        .pipe(_.cssnano())
        .on('error', handleError)
        .pipe(gulp.dest(output + '/css'))
        .pipe(_.size({title: 'styles'}))
})


// Static Assets
// -------------------------------------------------

gulp.task('images', () => {
    return gulp.src(imgSource)
        .pipe(_.imagemin({
          progressive: true,
          interlaced: true
        }))
        .pipe(gulp.dest(output + '/img'))
        .pipe(_.size({title: 'images'}))
})

gulp.task('fonts', () => {
    return gulp.src(fontSource)
        .pipe(gulp.dest(output + '/fonts'))
        .pipe(_.size({title: 'fonts'}))
})


// Server
// -------------------------------------------------

const serverOptions = {
	clean_urls: true,
	port: 8000,
	gzip: true,
	debug: true,
	cwd: output,
	config: {
		// root: output,
	}
}
const server = superstatic.server(serverOptions)

// gulp.task('server-reload', () => {
//     server.close()
// })

gulp.task('server', () => {
    server.listen(() => {
        console.log( 'Server running on port ' + serverOptions.port )
    })
})

// Deploy
// -------------------------------------------------

// TODO: translate bash to gulp
gulp.task('deploy', () => {
  // echo "Deploying static.com..."
  //
  // gulp build
  // BUILD_FOLDER=build
  // rm -f $BUILD_FOLDER/img#<{(|
  // cp -f assets/images#<{(| $BUILD_FOLDER/img/
  // cp -f .bitballoon $BUILD_FOLDER
  // cd $BUILD_FOLDER
  // bitballoon deploy || exit 1
  // cd ..
  //
  // echo "> Deploy completed!"
})

// Tasks
// -------------------------------------------------

gulp.task('watch', () => {
    gulp.watch(cssWatchSource,  gulp.series('css',    ))
    gulp.watch(jsSource,        gulp.series('js',     ))
    gulp.watch(htmlWatchSource, gulp.series('build',   ))
    gulp.watch(imgSource,       gulp.series('images', ))
})

gulp.task('build', gulp.series(
	// gulp.parallel('html', 'blog', 'images', 'fonts', 'css', 'jslib', 'js')
	gulp.parallel('html', 'css', 'jslib', 'js')
))

gulp.task('deploy', gulp.series(
	gulp.parallel('html', 'blog', 'images', 'fonts', 'css', 'jslib', 'js')
))

gulp.task('default', gulp.series(gulp.parallel('build', 'server', 'watch')))


// Helpers
// -------------------------------------------------

function handleError(err) {
    log.error(err)
    // gulp.notify({
    //     message: err
    // })
}
