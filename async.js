/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    var util = require("util");
    var vm = require("vm");
    var fs = require('fs');
    var fspath = require('path');
	var _ = require('underscore');
	
	var handleResults = function(ctx, msg, results) {		
		if (results == null) {
			results = [];
		} else if (results.length == null) {
			results = [results];
		}
		if (msg._topic) {
			for (var m in results) {
				if (results[m]) {
					if (util.isArray(results[m])) {
						for (var n in results[m]) {
							results[m][n]._topic = msg._topic;
						}
					} else {
						results[m]._topic = msg._topic;
					}
				}
			}
		}
		ctx.send(results);
	};    

    function AsyncFunctionNode(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name;
        this.async = n.async;
        var functionText = "var results = (function(msg){"+this.async+"\n})(msg);";
				
        this.topic = n.topic;
        this.context = {global:RED.settings.functionGlobalContext || {}};
						
        try {
            this.script = vm.createScript(functionText);
            this.on("input", function(msg) {
                if (msg != null) {
					var ctx = this;
					var cb = function(result) { handleResults(ctx, msg, result) };
                    var sandbox = {cb:cb, msg:msg,console:console,util:util,Buffer:Buffer,context:this.context, _:_} ;
                    try {
                        this.script.runInNewContext(sandbox);
                        var results = sandbox.results;
						handleResults(this, msg, results);						                    

                    } catch(err) {
                        this.error(err.toString());
                    }
                }
            });
        } catch(err) {
            this.error(err);
        }
    }

    RED.nodes.registerType("async",AsyncFunctionNode);
    RED.library.register("async");
}
