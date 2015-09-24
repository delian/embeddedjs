/**
 * Created by delian on 9/23/15.
 */
var ___GLOBAL_EJS_CACHE = {};

function EJS(options) {
    if (!this instanceof EJS) return new EJS(options);
    this.options = options || {};
    return this.refresh();
}

EJS.prototype.refresh = function() {
    var me = this;
    var options = me.options;

    me.cache = typeof options.cache === 'undefined' ? ___GLOBAL_EJS_CACHE : options.cache;
    me.template = "";
    me.leftBranch = "<%";
    me.rightBranch = "%>";

    if (options.url) {
        me.getUrlCache({
            url: options.url,
            success: function(data) {
                me.template = me.compile(data);
                if (typeof options.cb == 'function') options.cb(me);
            },
            failure: function() {
                if (typeof options.cb == 'function') options.cb(null); // or throw Error?
            }
        });
    }
};

EJS.prototype.getUrl = function(options) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                if (typeof options.success == "function") options.success(req.responseText);
            } else {
                if (typeof options.failure == "function") options.failure(null);
            }
        }
    };
    req.open(options.method || "GET", options.url);
    req.send(null);
};

EJS.prototype.getUrlCache = function(options) {
    var me = this;
    var url = options.url;

    if (this.cache[url]) {
        return options.success(this.cache[url]);
    }

    this.getUrl({
        url: url,
        success: function(data) {
            me.cache[url] = data;
            if (typeof options.success == "function")
                options.success(data);
        },
        failure: function() {
            me.cache[url] = null;
            if (typeof options.failure == "function")
                options.failure();
        }
    })
};

EJS.prototype.compile = function(data) {
    var me = this;

    function clean(content) {
        content = content.replace(/\\/g, '\\\\');
        content = content.replace(/\n/g, '\\n');
        content = content.replace(/"/g,  '\\"');
        return content;
    }

    data = data.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
    var left; var right;
    var l = data.split(me.leftBranch);
    var s = 'with(obj) { var __s = "' + clean(l[0]) + '";';
    for (var i = 1; i< l.length; i++) {
        var pos = l[i].indexOf(me.rightBranch);
        if (pos>=0) {
            left = l[i].substr(0, pos);
            right = l[i].substr(pos+me.rightBranch.length);
        } else {
            left = l[i];
            right = "";
        }
        switch(left.substr(0,1)) {
            case '=':
                s+= '__s+'+left+';';
                break;
            default:
                s+=left;
        }
        s+='__s+="'+clean(right)+'";';
    }
    s+=' }; return __s;';

    me.compileCode = s;
    console.log('Compiled', s);
    return new Function('obj', s);
};

EJS.prototype.render = function(obj) {
    if (typeof obj == 'string') obj = { value: obj };
    return this.template(obj);
};

EJS.prototype.update = function(el, obj) {
    var doc = document.getElementById(el);
    if (doc) doc.innerHTML = this.template(obj);
};
