//
// Includes
//

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const clean = require('gulp-clean');
const replace = require('gulp-replace');
const pug = require('gulp-pug');
const htmlPrettify = require('gulp-html-prettify');
const bowerFiles = require('main-bower-files');
const imagemin = require('gulp-imagemin');

const Paths = {
  SOURCE: 'app/edit',
  DEST: 'app/serve',
  DEST_SRC: 'app/serve/src',
  DEST_IMAGES: 'app/serve/images',
};

const Globs = {
  SCRIPTS: [`${Paths.SOURCE}/*.js`, `${Paths.SOURCE}/src/**/*.js`, `${Paths.SOURCE}/src/*.js`],
  HTML: [`${Paths.SOURCE}/src/**/*.html`,`${Paths.SOURCE}/*.html`],
  PUG: [`${Paths.SOURCE}/*.pug`,`${Paths.SOURCE}/src/**/*.pug`],
  MARKUP: [`${Paths.SOURCE}/src/**/*.html`,`${Paths.SOURCE}/*.html`,`${Paths.SOURCE}/src/**/*.pug`],
  BOWER_JSON: [`${Paths.SOURCE}/bower.json`],
  JSON: [`${Paths.SOURCE}/*.json`],
  PNG: [`${Paths.SOURCE}/images/**/*.png`],
  JPG: [`${Paths.SOURCE}/images/**/*.jpg`],
  ICO: [`${Paths.SOURCE}/images/**/*.ico`],
  IMAGES: [`${Paths.SOURCE}/images/**/*.png`,`${Paths.SOURCE}/images/**/*.jpg`,`${Paths.SOURCE}/images/**/*.gif`,`${Paths.SOURCE}/images/**/*.ico`]
};

let Environment = {
  NODE_ENV: 'development',
  BUTTRESS_ADMIN_BUTTRESS_URL: ''
};

// Replace Environment defaults with local vars
for (const key in Environment) {
  if (!process.env[key]) {
    continue;
  }
  if (process.env[key]) {
    Environment[key] = process.env[key];
  }
}

const __envReplace = (stream) => {
  Object.keys(Environment).forEach(key => {
    stream = stream.pipe(replace(`%${key}%`, Environment[key]));
  })

  return stream;
};

//
// Scripts
//
gulp.task('js', function() {
  return __envReplace(gulp.src(Globs.SCRIPTS, {base: `${Paths.SOURCE}`}))
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(gulp.dest(Paths.DEST));
});

gulp.task('scripts', function() {
  return gulp.start(['js']);
});

//
// Markup
//
gulp.task('html', function() {
  return gulp.src(Globs.HTML, {base: Paths.SOURCE})
		.pipe(gulp.dest(Paths.DEST));
});

gulp.task('pug', function() {
  return __envReplace(gulp.src(Globs.PUG, {base: Paths.SOURCE}))
		.pipe(pug())
    .pipe(htmlPrettify())
		.pipe(gulp.dest(Paths.DEST));
});

gulp.task('markup', function() {
  return gulp.start(['pug', 'html']);
});

//
// images
//
gulp.task('png', function() {
  return gulp.src(Globs.PNG)
    .pipe(imagemin())
		.pipe(gulp.dest(Paths.DEST_IMAGES));
});

gulp.task('jpg', function() {
  return gulp.src(Globs.JPG)
    .pipe(imagemin())
		.pipe(gulp.dest(Paths.DEST_IMAGES));
});

gulp.task('images', function() {
  return gulp.start(['png','jpg']);
});

//
// Static resources
//
gulp.task('json', function() {
  return gulp.src(Globs.JSON)
    .pipe(gulp.dest(Paths.DEST));
});

gulp.task('bower-files', function() {
  return gulp.src(bowerFiles({
    paths: {
      bowerDirectory: `${Paths.SOURCE}/bower_components`,
      bowerJson: `${Paths.SOURCE}/bower.json`
    }
  }), {
    base: `${Paths.SOURCE}/bower_components`
  }).pipe(gulp.dest(`${Paths.DEST}/bower_components`));
});

gulp.task('resources', function() {
  return gulp.start(['json', 'bower-files']);
});

//
//
//
gulp.task('clean', function() {
  return gulp.src([`${Paths.DEST}/*`], {read: false})
  .pipe(clean())
});

gulp.task('build', ['clean'], function() {
  return gulp.start(['resources', 'scripts', 'images', 'markup']);
});

gulp.task('watch', ['build'], function() {
  gulp.watch(Globs.SCRIPTS, ['scripts']);
  gulp.watch(Globs.IMAGES, ['images']);
  gulp.watch(Globs.MARKUP, ['markup']);
  gulp.watch(Globs.BOWER_JSON, ['bower-files']);
  gulp.watch(Globs.JSON, ['json']);
});
