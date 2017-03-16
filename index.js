'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

var formats = {
    '.ttf': 'truetype',
    '.woff': 'woff',
    '.svg': 'svg',
    '.eot': 'embedded-opentype'
};

module.exports = function (opts) {
    // For backwardscompatability, if its a function it means a formatter. Else expects a config-object.
    var options = typeof opts === 'function' ? {
        formatter: opts
    } : opts;

    // create a stream through which each file will pass
    return through.obj(function (file, enc, callback) {
        if (file.isNull()) {
            this.push(file);
            // do nothing if no contents
            return callback();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-font64', 'Streaming not supported'));
            return callback();
        }

        if (file.isBuffer()) {
            var file64 = new Buffer(file.contents).toString('base64');
            var mtype = mime.lookup(file.path);
            var fileext = path.extname(file.path);
            var format = formats[fileext];
            var filename = path.basename(file.path, fileext);

            var csswrapper = '';
            if (options.formatter) {
                csswrapper = options.formatter(filename, mtype, file64, format);
            } else {
                csswrapper = '@font-face {font-family: ' + filename + '; src: url(data:' + mtype + ';base64,' + file64 + ') format("' + format + '");}';
            }

            var extention = options.extention ? options.extention : 'css';

            file.contents = new Buffer(csswrapper);
            file.path = gutil.replaceExtension(file.path, '.' + extention);
            return callback(null, file);
        }
    });
}; 