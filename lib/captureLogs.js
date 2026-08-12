/*
Copyright 2016 - 2026, Robin de Gruijter (gruijter@hotmail.com)

This file is part of com.gruijter.sms.

com.gruijter.sms is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

com.gruijter.sms is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with com.gruijter.sms.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const StdOutFixture = require('fixture-stdout');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Log object to keep logs in memory and in persistent storage.
// Captures and reroutes Homey's this.log (stdout) and this.error (stderr).
class CaptureLogs {

  constructor(opts) {
    this.homey = opts.homey;
    this.logName = opts.name || 'log';
    this.logLength = opts.length || 50;
    this.logFile = `/userdata/${this.logName}.json`;
    this.logArray = [];
    this.captureStdOut();
    this.captureStdErr();
    this.readLogs();
  }

  // synchronous: called from the constructor, logs must be available immediately
  readLogs() {
    try {
      const log = fs.readFileSync(this.logFile, 'utf8');
      this.logArray = JSON.parse(log);
      this.homey.log('logfile retrieved');
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.homey.log('logfile not found');
      } else {
        this.homey.error('error parsing logfile: ', error.message);
      }
    }
    return this.logArray;
  }

  async saveLogs() {
    this.homey.log('saving logfile...');
    await fsPromises.writeFile(this.logFile, JSON.stringify(this.logArray));
    return 'logfile saved';
  }

  async deleteLogs() {
    try {
      await fsPromises.unlink(this.logFile);
      this.homey.log('logfile deleted');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.homey.log('logfile not found, in-memory logs deleted');
    }
    this.logArray = [];
    return 'logfile deleted';
  }

  captureStdOut() {
    this.captureStdout = new StdOutFixture({ stream: process.stdout });
    this.captureStdout.capture((string) => {
      if (this.logArray.length >= this.logLength) this.logArray.shift();
      this.logArray.push(string);
    });
    this.homey.log('capturing stdout');
  }

  captureStdErr() {
    this.captureStderr = new StdOutFixture({ stream: process.stderr });
    this.captureStderr.capture((string) => {
      if (this.logArray.length >= this.logLength) this.logArray.shift();
      this.logArray.push(string);
    });
    this.homey.log('capturing stderr');
  }

  releaseStdOut() {
    this.captureStdout.release();
  }

  releaseStdErr() {
    this.captureStderr.release();
  }

}

module.exports = CaptureLogs;
