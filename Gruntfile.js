
module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: "",

    // Task configuration.
    clean: {
      dist: ['dist']
    },


    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: false
      },
      bootstrap: {
        src: [
          'src/js/widgets.js',
          'src/js/widgets-address.js',
          'src/js/widgets-collections.js',
          'src/js/widgets-cooccurence.js',
          'src/js/widgets-dls.js',
          'src/js/widgets-docbuilder.js',
          'src/js/widgets-documents.js',
          'src/js/widgets-explore.js',
          'src/js/widgets-highcharts.js',
          'src/js/widgets-ingest.js',
          'src/js/widgets-kratu.js',
          'src/js/widgets-markings.js',
          'src/js/widgets-openlayers.js',
          'src/js/widgets-profile.js',
          'src/js/widgets-rdb2rdf.js',
          'src/js/widgets-search.js',
          'src/js/widgets-tagcloud.js',
          'src/js/widgets-triples.js',
          'src/js/widgets-workplace.js'
        ],
        dest: 'dist/browser-dev/mljs-widgets.js'
      }
    },

    uglify: {
      bootstrap: {
        options: {
          banner: '<%= banner %>'
        },
        src: '<%= concat.bootstrap.dest %>',
        dest: 'dist/browser-prod/mljs-widgets.min.js'
      }
    }


  });


  grunt.registerTask('dist-js', ['concat', 'uglify']);

  grunt.registerTask('dist', ['clean', 'dist-js']);


};
