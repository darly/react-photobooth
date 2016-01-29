var gulp = require('gulp');  // Base gulp package
var babelify = require('babelify'); // Used to convert ES6 & JSX to ES5
var browserify = require('browserify'); // Providers "require" support, CommonJS
var notify = require('gulp-notify'); // Provides notification to both the console and Growel
var rename = require('gulp-rename'); // Rename sources
var sourcemaps = require('gulp-sourcemaps'); // Provide external sourcemap files
//var livereload = require('gulp-livereload'); // Livereload support for the browser
var gutil = require('gulp-util'); // Provides gulp utilities, including logging and beep
var chalk = require('chalk'); // Allows for coloring for logging
var source = require('vinyl-source-stream'); // Vinyl stream support
var buffer = require('vinyl-buffer'); // Vinyl stream support
var watchify = require('watchify'); // Watchify for source changes
var merge = require('utils-merge'); // Object merge tool
var duration = require('gulp-duration'); // Time aspects of your gulp process
var eslint = require('gulp-eslint'); //Lint JS files, including JSX

var config = {
	paths: {
		src: 'src/app.jsx',
		watch: './js/**/*',
		outputDir: './dist/',
		outputFile: 'bidSmartBundle.js',
	}
};

// Error reporting function
function mapError(err) {
  if (err.fileName) {
    // Regular error
    gutil.log(chalk.red(err.name)
      + ': ' + chalk.yellow(err.fileName.replace(__dirname + '/src/js/', ''))
      + ': ' + 'Line ' + chalk.magenta(err.lineNumber)
      + ' & ' + 'Column ' + chalk.magenta(err.columnNumber || err.column)
      + ': ' + chalk.blue(err.description));
  } else {
    // Browserify error..
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.message));
  }
}

// Completes the final file outputs

function bundle(bundler) {
  var bundleTimer = duration('Javascript bundle time');

  bundler
    .bundle()
    .on('error', mapError) // Map error reporting
    .pipe(source('app.jsx')) // Set source name
    .pipe(buffer()) // Convert to gulp pipeline
    .pipe(rename(config.paths.outputFile)) // Rename the output file
    .pipe(sourcemaps.init({loadMaps: true})) // Extract the inline sourcemaps
    .pipe(sourcemaps.write('./map')) // Set folder for sourcemaps to output to
    .pipe(gulp.dest(config.paths.outputDir)) // Set the output folder
    .pipe(notify({
      message: 'Generated file: <%= file.relative %>',
    })) // Output the file being created
    .pipe(bundleTimer); // Output time timing of the file creation
    //.pipe(livereload()); // Reload the view in the browser
}


function build() {
  //livereload.listen(); // Start livereload server
  var args = merge(watchify.args, { debug: true }); // Merge in default watchify args with browserify arguments
  //configuring the bundle
  var bundler = browserify(config.paths.src, args) // Browserify
    .plugin(watchify, {ignoreWatch: ['**/node_modules/**']}) // Watchify to watch source file changes
    .transform(babelify, {presets: ['es2015', 'react']}); // Babel tranforms

  bundle(bundler); // Run the bundle the first time (required for Watchify to kick in)

  bundler.on('update', function() {
    bundle(bundler); // Re-run bundle on source updates
    lint(); // Re-run lint on update
  });
}

//Runs lint and the files
function lint() {
	return gulp.src(config.paths.src)
		.pipe(eslint({config: 'eslint.config.json'}))
		.pipe(eslint.format());
}

// Gulp task for build
gulp.task('build', build);
gulp.task('lint', lint);
gulp.task('default', ['build', 'lint']);