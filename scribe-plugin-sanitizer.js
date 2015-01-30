!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.scribePluginSanitizer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// UMD
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.amdWeb = factory();
  }
}(this, function () {

  function HTMLJanitor(config) {
    this.config = config;
  }

  HTMLJanitor.prototype.clean = function (html) {
    var sandbox = document.createElement('div');
    sandbox.innerHTML = html;

    this._sanitize(sandbox);

    return sandbox.innerHTML;
  };

  HTMLJanitor.prototype._sanitize = function (parentNode) {
    var treeWalker = createTreeWalker(parentNode);
    var node = treeWalker.firstChild();
    if (!node) { return; }

    do {
      var nodeName = node.nodeName.toLowerCase();
      var allowedAttrs = this.config.tags[nodeName];

      // Ignore text nodes and nodes that have already been sanitized
      if (node.nodeType === 3 || node._sanitized) {
        continue;
      }

      var isInlineElement = nodeName === 'b';
      var containsBlockElement;
      if (isInlineElement) {
        containsBlockElement = Array.prototype.some.call(node.childNodes, function (childNode) {
          // TODO: test other block elements
          return childNode.nodeName === 'P';
        });
      }

      var isInvalid = isInlineElement && containsBlockElement;

      // Drop tag entirely according to the whitelist *and* if the markup
      // is invalid.
      if (!this.config.tags[nodeName] || isInvalid) {
        // Do not keep the inner text of SCRIPT/STYLE elements.
        if (! (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE')) {
          while (node.childNodes.length > 0) {
            parentNode.insertBefore(node.childNodes[0], node);
          }
        }
        parentNode.removeChild(node);

        this._sanitize(parentNode);
        break;
      }

      // Sanitize attributes
      for (var a = 0; a < node.attributes.length; a += 1) {
        var attr = node.attributes[a];
        var attrName = attr.name.toLowerCase();

        // Allow attribute?
        var allowedAttrValue = allowedAttrs[attrName];
        var notInAttrList = ! allowedAttrValue;
        var valueNotAllowed = allowedAttrValue !== true && attr.value !== allowedAttrValue;
        if (notInAttrList || valueNotAllowed) {
          node.removeAttribute(attr.name);
          // Shift the array to continue looping.
          a = a - 1;
        }
      }

      // Sanitize children
      this._sanitize(node);

      // Mark node as sanitized so it's ignored in future runs
      node._sanitized = true;
    } while (node = treeWalker.nextSibling());
  };

  function createTreeWalker(node) {
    return document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
  }

  return HTMLJanitor;

}));

},{}],2:[function(require,module,exports){
var baseCreateCallback = require('../internals/baseCreateCallback'), forOwn = require('../objects/forOwn');
function forEach(collection, callback, thisArg) {
    var index = -1, length = collection ? collection.length : 0;
    callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
    if (typeof length == 'number') {
        while (++index < length) {
            if (callback(collection[index], index, collection) === false) {
                break;
            }
        }
    } else {
        forOwn(collection, callback);
    }
    return collection;
}
module.exports = forEach;
},{"../internals/baseCreateCallback":8,"../objects/forOwn":24}],3:[function(require,module,exports){
var createWrapper = require('../internals/createWrapper'), slice = require('../internals/slice');
function bind(func, thisArg) {
    return arguments.length > 2 ? createWrapper(func, 17, slice(arguments, 2), null, thisArg) : createWrapper(func, 1, null, null, thisArg);
}
module.exports = bind;
},{"../internals/createWrapper":11,"../internals/slice":20}],4:[function(require,module,exports){
var arrayPool = [];
module.exports = arrayPool;
},{}],5:[function(require,module,exports){
var baseCreate = require('./baseCreate'), isObject = require('../objects/isObject'), setBindData = require('./setBindData'), slice = require('./slice');
var arrayRef = [];
var push = arrayRef.push;
function baseBind(bindData) {
    var func = bindData[0], partialArgs = bindData[2], thisArg = bindData[4];
    function bound() {
        if (partialArgs) {
            var args = slice(partialArgs);
            push.apply(args, arguments);
        }
        if (this instanceof bound) {
            var thisBinding = baseCreate(func.prototype), result = func.apply(thisBinding, args || arguments);
            return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
    }
    setBindData(bound, bindData);
    return bound;
}
module.exports = baseBind;
},{"../objects/isObject":27,"./baseCreate":7,"./setBindData":17,"./slice":20}],6:[function(require,module,exports){
var assign = require('../objects/assign'), forEach = require('../collections/forEach'), forOwn = require('../objects/forOwn'), getArray = require('./getArray'), isArray = require('../objects/isArray'), isObject = require('../objects/isObject'), releaseArray = require('./releaseArray'), slice = require('./slice');
var reFlags = /\w*$/;
var argsClass = '[object Arguments]', arrayClass = '[object Array]', boolClass = '[object Boolean]', dateClass = '[object Date]', funcClass = '[object Function]', numberClass = '[object Number]', objectClass = '[object Object]', regexpClass = '[object RegExp]', stringClass = '[object String]';
var cloneableClasses = {};
cloneableClasses[funcClass] = false;
cloneableClasses[argsClass] = cloneableClasses[arrayClass] = cloneableClasses[boolClass] = cloneableClasses[dateClass] = cloneableClasses[numberClass] = cloneableClasses[objectClass] = cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;
var objectProto = Object.prototype;
var toString = objectProto.toString;
var hasOwnProperty = objectProto.hasOwnProperty;
var ctorByClass = {};
ctorByClass[arrayClass] = Array;
ctorByClass[boolClass] = Boolean;
ctorByClass[dateClass] = Date;
ctorByClass[funcClass] = Function;
ctorByClass[objectClass] = Object;
ctorByClass[numberClass] = Number;
ctorByClass[regexpClass] = RegExp;
ctorByClass[stringClass] = String;
function baseClone(value, isDeep, callback, stackA, stackB) {
    if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
            return result;
        }
    }
    var isObj = isObject(value);
    if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
            return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
        case boolClass:
        case dateClass:
            return new ctor(+value);
        case numberClass:
        case stringClass:
            return new ctor(value);
        case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
    } else {
        return value;
    }
    var isArr = isArray(value);
    if (isDeep) {
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());
        var length = stackA.length;
        while (length--) {
            if (stackA[length] == value) {
                return stackB[length];
            }
        }
        result = isArr ? ctor(value.length) : {};
    } else {
        result = isArr ? slice(value) : assign({}, value);
    }
    if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
            result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
            result.input = value.input;
        }
    }
    if (!isDeep) {
        return result;
    }
    stackA.push(value);
    stackB.push(result);
    (isArr ? forEach : forOwn)(value, function (objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
    });
    if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
    }
    return result;
}
module.exports = baseClone;
},{"../collections/forEach":2,"../objects/assign":21,"../objects/forOwn":24,"../objects/isArray":25,"../objects/isObject":27,"./getArray":12,"./releaseArray":16,"./slice":20}],7:[function(require,module,exports){
var isNative = require('./isNative'), isObject = require('../objects/isObject'), noop = require('../utilities/noop');
var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate;
function baseCreate(prototype, properties) {
    return isObject(prototype) ? nativeCreate(prototype) : {};
}
if (!nativeCreate) {
    baseCreate = function () {
        function Object() {
        }
        return function (prototype) {
            if (isObject(prototype)) {
                Object.prototype = prototype;
                var result = new Object();
                Object.prototype = null;
            }
            return result || window.Object();
        };
    }();
}
module.exports = baseCreate;
},{"../objects/isObject":27,"../utilities/noop":33,"./isNative":13}],8:[function(require,module,exports){
var bind = require('../functions/bind'), identity = require('../utilities/identity'), setBindData = require('./setBindData'), support = require('../support');
var reFuncName = /^\s*function[ \n\r\t]+\w/;
var reThis = /\bthis\b/;
var fnToString = Function.prototype.toString;
function baseCreateCallback(func, thisArg, argCount) {
    if (typeof func != 'function') {
        return identity;
    }
    if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
    }
    var bindData = func.__bindData__;
    if (typeof bindData == 'undefined') {
        if (support.funcNames) {
            bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
            var source = fnToString.call(func);
            if (!support.funcNames) {
                bindData = !reFuncName.test(source);
            }
            if (!bindData) {
                bindData = reThis.test(source);
                setBindData(func, bindData);
            }
        }
    }
    if (bindData === false || bindData !== true && bindData[1] & 1) {
        return func;
    }
    switch (argCount) {
    case 1:
        return function (value) {
            return func.call(thisArg, value);
        };
    case 2:
        return function (a, b) {
            return func.call(thisArg, a, b);
        };
    case 3:
        return function (value, index, collection) {
            return func.call(thisArg, value, index, collection);
        };
    case 4:
        return function (accumulator, value, index, collection) {
            return func.call(thisArg, accumulator, value, index, collection);
        };
    }
    return bind(func, thisArg);
}
module.exports = baseCreateCallback;
},{"../functions/bind":3,"../support":31,"../utilities/identity":32,"./setBindData":17}],9:[function(require,module,exports){
var baseCreate = require('./baseCreate'), isObject = require('../objects/isObject'), setBindData = require('./setBindData'), slice = require('./slice');
var arrayRef = [];
var push = arrayRef.push;
function baseCreateWrapper(bindData) {
    var func = bindData[0], bitmask = bindData[1], partialArgs = bindData[2], partialRightArgs = bindData[3], thisArg = bindData[4], arity = bindData[5];
    var isBind = bitmask & 1, isBindKey = bitmask & 2, isCurry = bitmask & 4, isCurryBound = bitmask & 8, key = func;
    function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
            var args = slice(partialArgs);
            push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
            args || (args = slice(arguments));
            if (partialRightArgs) {
                push.apply(args, partialRightArgs);
            }
            if (isCurry && args.length < arity) {
                bitmask |= 16 & ~32;
                return baseCreateWrapper([
                    func,
                    isCurryBound ? bitmask : bitmask & ~3,
                    args,
                    null,
                    thisArg,
                    arity
                ]);
            }
        }
        args || (args = arguments);
        if (isBindKey) {
            func = thisBinding[key];
        }
        if (this instanceof bound) {
            thisBinding = baseCreate(func.prototype);
            var result = func.apply(thisBinding, args);
            return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
    }
    setBindData(bound, bindData);
    return bound;
}
module.exports = baseCreateWrapper;
},{"../objects/isObject":27,"./baseCreate":7,"./setBindData":17,"./slice":20}],10:[function(require,module,exports){
var forEach = require('../collections/forEach'), forOwn = require('../objects/forOwn'), isArray = require('../objects/isArray'), isPlainObject = require('../objects/isPlainObject');
function baseMerge(object, source, callback, stackA, stackB) {
    (isArray(source) ? forEach : forOwn)(source, function (source, key) {
        var found, isArr, result = source, value = object[key];
        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
            var stackLength = stackA.length;
            while (stackLength--) {
                if (found = stackA[stackLength] == source) {
                    value = stackB[stackLength];
                    break;
                }
            }
            if (!found) {
                var isShallow;
                if (callback) {
                    result = callback(value, source);
                    if (isShallow = typeof result != 'undefined') {
                        value = result;
                    }
                }
                if (!isShallow) {
                    value = isArr ? isArray(value) ? value : [] : isPlainObject(value) ? value : {};
                }
                stackA.push(source);
                stackB.push(value);
                if (!isShallow) {
                    baseMerge(value, source, callback, stackA, stackB);
                }
            }
        } else {
            if (callback) {
                result = callback(value, source);
                if (typeof result == 'undefined') {
                    result = source;
                }
            }
            if (typeof result != 'undefined') {
                value = result;
            }
        }
        object[key] = value;
    });
}
module.exports = baseMerge;
},{"../collections/forEach":2,"../objects/forOwn":24,"../objects/isArray":25,"../objects/isPlainObject":28}],11:[function(require,module,exports){
var baseBind = require('./baseBind'), baseCreateWrapper = require('./baseCreateWrapper'), isFunction = require('../objects/isFunction'), slice = require('./slice');
var arrayRef = [];
var push = arrayRef.push, unshift = arrayRef.unshift;
function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
    var isBind = bitmask & 1, isBindKey = bitmask & 2, isCurry = bitmask & 4, isCurryBound = bitmask & 8, isPartial = bitmask & 16, isPartialRight = bitmask & 32;
    if (!isBindKey && !isFunction(func)) {
        throw new TypeError();
    }
    if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
    }
    if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
    }
    var bindData = func && func.__bindData__;
    if (bindData && bindData !== true) {
        bindData = slice(bindData);
        if (bindData[2]) {
            bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
            bindData[3] = slice(bindData[3]);
        }
        if (isBind && !(bindData[1] & 1)) {
            bindData[4] = thisArg;
        }
        if (!isBind && bindData[1] & 1) {
            bitmask |= 8;
        }
        if (isCurry && !(bindData[1] & 4)) {
            bindData[5] = arity;
        }
        if (isPartial) {
            push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        if (isPartialRight) {
            unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
    }
    var creater = bitmask == 1 || bitmask === 17 ? baseBind : baseCreateWrapper;
    return creater([
        func,
        bitmask,
        partialArgs,
        partialRightArgs,
        thisArg,
        arity
    ]);
}
module.exports = createWrapper;
},{"../objects/isFunction":26,"./baseBind":5,"./baseCreateWrapper":9,"./slice":20}],12:[function(require,module,exports){
var arrayPool = require('./arrayPool');
function getArray() {
    return arrayPool.pop() || [];
}
module.exports = getArray;
},{"./arrayPool":4}],13:[function(require,module,exports){
var objectProto = Object.prototype;
var toString = objectProto.toString;
var reNative = RegExp('^' + String(toString).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/toString| for [^\]]+/g, '.*?') + '$');
function isNative(value) {
    return typeof value == 'function' && reNative.test(value);
}
module.exports = isNative;
},{}],14:[function(require,module,exports){
var maxPoolSize = 40;
module.exports = maxPoolSize;
},{}],15:[function(require,module,exports){
var objectTypes = {
        'boolean': false,
        'function': true,
        'object': true,
        'number': false,
        'string': false,
        'undefined': false
    };
module.exports = objectTypes;
},{}],16:[function(require,module,exports){
var arrayPool = require('./arrayPool'), maxPoolSize = require('./maxPoolSize');
function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
        arrayPool.push(array);
    }
}
module.exports = releaseArray;
},{"./arrayPool":4,"./maxPoolSize":14}],17:[function(require,module,exports){
var isNative = require('./isNative'), noop = require('../utilities/noop');
var descriptor = {
        'configurable': false,
        'enumerable': false,
        'value': null,
        'writable': false
    };
var defineProperty = function () {
        try {
            var o = {}, func = isNative(func = Object.defineProperty) && func, result = func(o, o, o) && func;
        } catch (e) {
        }
        return result;
    }();
var setBindData = !defineProperty ? noop : function (func, value) {
        descriptor.value = value;
        defineProperty(func, '__bindData__', descriptor);
    };
module.exports = setBindData;
},{"../utilities/noop":33,"./isNative":13}],18:[function(require,module,exports){
var forIn = require('../objects/forIn'), isFunction = require('../objects/isFunction');
var objectClass = '[object Object]';
var objectProto = Object.prototype;
var toString = objectProto.toString;
var hasOwnProperty = objectProto.hasOwnProperty;
function shimIsPlainObject(value) {
    var ctor, result;
    if (!(value && toString.call(value) == objectClass) || (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
    }
    forIn(value, function (value, key) {
        result = key;
    });
    return typeof result == 'undefined' || hasOwnProperty.call(value, result);
}
module.exports = shimIsPlainObject;
},{"../objects/forIn":23,"../objects/isFunction":26}],19:[function(require,module,exports){
var objectTypes = require('./objectTypes');
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var shimKeys = function (object) {
    var index, iterable = object, result = [];
    if (!iterable)
        return result;
    if (!objectTypes[typeof object])
        return result;
    for (index in iterable) {
        if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
        }
    }
    return result;
};
module.exports = shimKeys;
},{"./objectTypes":15}],20:[function(require,module,exports){
function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
        end = array ? array.length : 0;
    }
    var index = -1, length = end - start || 0, result = Array(length < 0 ? 0 : length);
    while (++index < length) {
        result[index] = array[start + index];
    }
    return result;
}
module.exports = slice;
},{}],21:[function(require,module,exports){
var baseCreateCallback = require('../internals/baseCreateCallback'), keys = require('./keys'), objectTypes = require('../internals/objectTypes');
var assign = function (object, source, guard) {
    var index, iterable = object, result = iterable;
    if (!iterable)
        return result;
    var args = arguments, argsIndex = 0, argsLength = typeof guard == 'number' ? 2 : args.length;
    if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
    } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
    }
    while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
            var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0;
            while (++ownIndex < length) {
                index = ownProps[ownIndex];
                result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
            }
        }
    }
    return result;
};
module.exports = assign;
},{"../internals/baseCreateCallback":8,"../internals/objectTypes":15,"./keys":29}],22:[function(require,module,exports){
var baseClone = require('../internals/baseClone'), baseCreateCallback = require('../internals/baseCreateCallback');
function cloneDeep(value, callback, thisArg) {
    return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
}
module.exports = cloneDeep;
},{"../internals/baseClone":6,"../internals/baseCreateCallback":8}],23:[function(require,module,exports){
var baseCreateCallback = require('../internals/baseCreateCallback'), objectTypes = require('../internals/objectTypes');
var forIn = function (collection, callback, thisArg) {
    var index, iterable = collection, result = iterable;
    if (!iterable)
        return result;
    if (!objectTypes[typeof iterable])
        return result;
    callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
    for (index in iterable) {
        if (callback(iterable[index], index, collection) === false)
            return result;
    }
    return result;
};
module.exports = forIn;
},{"../internals/baseCreateCallback":8,"../internals/objectTypes":15}],24:[function(require,module,exports){
var baseCreateCallback = require('../internals/baseCreateCallback'), keys = require('./keys'), objectTypes = require('../internals/objectTypes');
var forOwn = function (collection, callback, thisArg) {
    var index, iterable = collection, result = iterable;
    if (!iterable)
        return result;
    if (!objectTypes[typeof iterable])
        return result;
    callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
    var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0;
    while (++ownIndex < length) {
        index = ownProps[ownIndex];
        if (callback(iterable[index], index, collection) === false)
            return result;
    }
    return result;
};
module.exports = forOwn;
},{"../internals/baseCreateCallback":8,"../internals/objectTypes":15,"./keys":29}],25:[function(require,module,exports){
var isNative = require('../internals/isNative');
var arrayClass = '[object Array]';
var objectProto = Object.prototype;
var toString = objectProto.toString;
var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;
var isArray = nativeIsArray || function (value) {
        return value && typeof value == 'object' && typeof value.length == 'number' && toString.call(value) == arrayClass || false;
    };
module.exports = isArray;
},{"../internals/isNative":13}],26:[function(require,module,exports){
function isFunction(value) {
    return typeof value == 'function';
}
module.exports = isFunction;
},{}],27:[function(require,module,exports){
var objectTypes = require('../internals/objectTypes');
function isObject(value) {
    return !!(value && objectTypes[typeof value]);
}
module.exports = isObject;
},{"../internals/objectTypes":15}],28:[function(require,module,exports){
var isNative = require('../internals/isNative'), shimIsPlainObject = require('../internals/shimIsPlainObject');
var objectClass = '[object Object]';
var objectProto = Object.prototype;
var toString = objectProto.toString;
var getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf;
var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function (value) {
        if (!(value && toString.call(value) == objectClass)) {
            return false;
        }
        var valueOf = value.valueOf, objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);
        return objProto ? value == objProto || getPrototypeOf(value) == objProto : shimIsPlainObject(value);
    };
module.exports = isPlainObject;
},{"../internals/isNative":13,"../internals/shimIsPlainObject":18}],29:[function(require,module,exports){
var isNative = require('../internals/isNative'), isObject = require('./isObject'), shimKeys = require('../internals/shimKeys');
var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;
var keys = !nativeKeys ? shimKeys : function (object) {
        if (!isObject(object)) {
            return [];
        }
        return nativeKeys(object);
    };
module.exports = keys;
},{"../internals/isNative":13,"../internals/shimKeys":19,"./isObject":27}],30:[function(require,module,exports){
var baseCreateCallback = require('../internals/baseCreateCallback'), baseMerge = require('../internals/baseMerge'), getArray = require('../internals/getArray'), isObject = require('./isObject'), releaseArray = require('../internals/releaseArray'), slice = require('../internals/slice');
function merge(object) {
    var args = arguments, length = 2;
    if (!isObject(object)) {
        return object;
    }
    if (typeof args[2] != 'number') {
        length = args.length;
    }
    if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
    } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
    }
    var sources = slice(arguments, 1, length), index = -1, stackA = getArray(), stackB = getArray();
    while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
    }
    releaseArray(stackA);
    releaseArray(stackB);
    return object;
}
module.exports = merge;
},{"../internals/baseCreateCallback":8,"../internals/baseMerge":10,"../internals/getArray":12,"../internals/releaseArray":16,"../internals/slice":20,"./isObject":27}],31:[function(require,module,exports){
var isNative = require('./internals/isNative');
var reThis = /\bthis\b/;
var support = {};
support.funcDecomp = !isNative(window.WinRTError) && reThis.test(function () {
    return this;
});
support.funcNames = typeof Function.name == 'string';
module.exports = support;
},{"./internals/isNative":13}],32:[function(require,module,exports){
function identity(value) {
    return value;
}
module.exports = identity;
},{}],33:[function(require,module,exports){
function noop() {
}
module.exports = noop;
},{}],34:[function(require,module,exports){
var HTMLJanitor = require('html-janitor'), merge = require('lodash-amd/modern/objects/merge'), cloneDeep = require('lodash-amd/modern/objects/cloneDeep');
'use strict';
module.exports = function (config) {
    var configAllowMarkers = merge(cloneDeep(config), { tags: { em: { 'class': 'scribe-marker' } } });
    return function (scribe) {
        var janitor = new HTMLJanitor.amdWeb(configAllowMarkers);
        scribe.registerHTMLFormatter('sanitize', janitor.clean.bind(janitor));
    };
};
},{"html-janitor":1,"lodash-amd/modern/objects/cloneDeep":22,"lodash-amd/modern/objects/merge":30}]},{},[34])(34)
});