/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable */

import * as globals from './globals';
import * as MessageTypes from './messageTypes.js';
import { filter, options, map, buildPath, packageCustomLog } from '../main.js';

// browser is defined in firefox, but not in chrome. In chrome, they use
// the 'chrome' global instead. Let's map it to browser so we don't have
// to have if-conditions all over the place.

var browser = browser || chrome;

// creates a Future for retrieval of the named keys
// the value specified is the default value if one doesn't exist in the storage
let store = browser.storage.local.get({
  sessionId: null,
  userAleHost: globals.userAleHost,
  userAleScript: globals.userAleScript,
  toolUser: globals.toolUser,
  toolName: globals.toolName,
  toolVersion: globals.toolVersion,
}, storeCallback);
        
function storeCallback(item) {
  injectScript({
    url: item.userAleHost,
    userId: item.toolUser,
    sessionID: item.sessionId,
    toolName: item.toolName,
    toolVersion: item.toolVersion
  });
}

function queueLog(log) {
  browser.runtime.sendMessage({ type: MessageTypes.ADD_LOG, payload: log });
}

function injectScript(config) {
  options(config);
//  start();  not necessary given that autostart in place, and option is masked from WebExt users
  map(function (log) {
    queueLog(Object.assign({}, log, {
      pageUrl: document.location.href,
    }));
    console.log(log);
    return false;
  });
}

browser.runtime.onMessage.addListener(function (message) {
  if (message.type === MessageTypes.CONFIG_CHANGE) {
    options({
      url: message.payload.userAleHost,
      userId: message.payload.toolUser,
      toolName: message.payload.toolName,
      toolVersion: message.payload.toolVersion
    });
  }
});

//Add additional custom scripts below this line
//=============================================

filter(function (log) {
  var type_array = ['mouseup', 'mouseover', 'mousedown', 'keydown', 'dblclick', 'blur', 'focus', 'input', 'wheel'];
  var logType_array = ['interval'];
  return !type_array.includes(log.type) && !logType_array.includes(log.logType);
});


function parseXml(xmlStr) {
  return new window.DOMParser().parseFromString(xmlStr, "text/xml");
}


function xmlProperties(event, attributes) {
  /**
   *      Input:
   * event: The event whose target data will be logged
   * attributes: The attributes of the target to be logged, a string of CSS Attribute selectors
   * 
   *      Output:
   * A log for the string of attributes.
   */

  let log = { description: "Chosen attributes of selected event target ",
              logType: "custom"}

   let serializer = new XMLSerializer(); 
   let xmlString = serializer.serializeToString(event.target);
   let xml = parseXml(xmlString);
   let attr = ''
   let elem = ''

   for (let i = 0; i < attributes.length; i++) {
      cssfmt = '[' + attributes[i] + ']'
      // console.log('looped for ' + i + 'times!')
      // console.log(cssfmt)
      elem = xml.querySelector(cssfmt);
      if (elem != null){
          attr = elem.getAttribute(attributes[i])
          // console.log(elem.getAttribute(attributes[i]));
          log[attributes[i]] = attr
      }
      else{
          // console.log("ERROR: Custom attribute [" + attributes[i] + "] could not be found");
      }
   }
  return log
}

window.addEventListener('click', function(e) {
  var e_path = buildPath(e);
  // console.log('click!');
  finlog = xmlProperties(e, ['data-info', 'class']);
  decoded = JSON.parse(finlog['data-info']);
  // console.log(e_path)
 
     if (e_path.includes('div.superset-legacy-chart-world-map') == true){
         //console.log(decoded.name)
         finlog['countryName'] = decoded.name;
         finlog['path'] = e_path;
         packageCustomLog(finlog);
     }
})

/*
 eslint-enable
 */