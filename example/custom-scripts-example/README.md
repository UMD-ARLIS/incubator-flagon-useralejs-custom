# Custom Script Examples

The following are examples illustrating how to add custom scripts UserALE.js. We can add custom scripts to generate additional logs or modify current logs - such as filtering or parsing and logging attributes attached to SVGs or Canvas. 

## Adding Custom Scripts

### Example 1 - Getting additional attributes as a separate log

The following code snippet will create a new custom log which includes `attributes` as a field.

```js
document.addEventListener('click', function(e) {
    let log = { description: "Attributes of event target ",
        logType: "custom",
        path: buildPath(e),
        attributes: e.target.attributes};
    window.userale.packageCustomLog(log);
   });
```

### Example 2 - Filtering trigger events

Below is an example of a script that can be added. This script will filter out certain events such as *mousedown, mouseup, mouseover, and etc...* so that such actions will not trigger a log to be generated.

```js
window.userale.filter(function (log) {
    var type_array = ['mouseup', 'mouseover', 'mousedown', 'keydown', 'dblclick', 'blur', 'focus', 'input', 'wheel'];
    var logType_array = ['interval'];
    return !type_array.includes(log.type) && !logType_array.includes(log.logType);
});
```
