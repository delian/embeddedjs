/**
 * Created by delian on 9/23/15.
 */

(function(global) {
    var ___GLOBAL_EJS_CACHE = {};
    var fs = null;

    function EJS(options) {
        if (!this instanceof EJS) return new EJS(options); // TODO: check it
        if (typeof options === 'string') options = { template: options };
        this.options = options || {};
        return this.refresh();
    }

    EJS.prototype.refresh = function() {
        var me = this;
        var options = me.options;

        me.cache = typeof options.cache === 'undefined' ? ___GLOBAL_EJS_CACHE : options.cache;
        me.leftBranch = options.leftBranch || "<%";
        me.rightBranch = options.rightBranch || "%>";
        me.template = "";

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
        } else if (options.template) {
            me.template = me.compile(options.template);
            if (typeof options.cb == 'function') options.cb(me);
        }
        return me;
    };

    EJS.prototype.browserXfer = function(options) {
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
        return this;
    };

    EJS.prototype.nodeXfer = function(options) {
        if (fs) {
            fs.readFile(options.url, function (err, data) {
                if (err) {
                    if (typeof options.failure === 'function') return options.failure();
                }
                if (typeof options.success === 'function') options.success(data);
            });
        } else throw "No node fs module!";
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
        });
        return this;
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
        var s = 'with (___views || {}) { with(___obj || {}) { var __s = "' + clean(l[0]) + '";';
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
        s+=' } }; return __s;';

        //me.compileCode = s;
        console.log('Compiled', s);
        return new Function('___obj', '___views', s);
    };

    EJS.prototype.render = function(obj) {
        if (typeof obj == 'string') obj = { value: obj };
        return this.template(obj, this.views);
    };

    EJS.prototype.update = function(el, obj) {
        var doc = document.getElementById(el);
        var me = this;
        if (doc) {
            if (typeof obj === 'string') {
                me.getUrlCache({
                    url: obj,
                    success: function(data) {
                        doc.innerHTML(JSON.parse(data));
                    }
                });
            } else doc.innerHTML = this.template(obj, me.views);
        }
        return me;
    };

    EJS.prototype.views = {
        link_tag: function(src) {
            return '<A HREF="'+src+'">';
        },
        date_tag: function(name, value , html_options) {
            if(! (value instanceof Date)) value = new Date();
            var month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var years = [], months = [], days =[];
            var year = value.getFullYear();
            var month = value.getMonth();
            var day = value.getDate();
            for(var y = year - 15; y < year+15 ; y++) years.push({value: y, text: y});
            for(var m = 0; m < 12; m++) months.push({value: (m), text: month_names[m]});
            for(var d = 0; d < 31; d++) days.push({value: (d+1), text: (d+1)});
            var year_select = this.select_tag(name+'[year]', year, years, {id: name+'[year]'} );
            var month_select = this.select_tag(name+'[month]', month, months, {id: name+'[month]'});
            var day_select = this.select_tag(name+'[day]', day, days, {id: name+'[day]'});
            return year_select+month_select+day_select;
        },
        form_tag: function (action, html_options) {
            html_options = html_options || {};
            html_options.action = action;
            if(html_options.multipart == true) {
                html_options.method = 'post';
                html_options.enctype = 'multipart/form-data';
            }
            return this.start_tag_for('form', html_options)
        },
        form_tag_end: function() { return this.tag_end('form'); },
        hidden_field_tag: function(name, value, html_options) {
            return this.input_field_tag(name, value, 'hidden', html_options);
        },
        input_field_tag: function(name, value , inputType, html_options) {
            html_options = html_options || {};
            html_options.id  = html_options.id  || name;
            html_options.value = value || '';
            html_options.type = inputType || 'text';
            html_options.name = name;
            return this.single_tag_for('input', html_options)
        },
        is_current_page: function(url) {
            return (window.location.href == url || window.location.pathname == url ? true : false);
        },
        link_to: function(name, url, html_options) {
            if(!name) name = 'null';
            if(!html_options) html_options = {};
            if(html_options.confirm){
                html_options.onclick = " var ret_confirm = confirm(\""+html_options.confirm+"\"); if(!ret_confirm){ return false;} ";
                html_options.confirm = null;
            }
            html_options.href=url;
            return this.start_tag_for('a', html_options)+name+ this.tag_end('a');
        },
        submit_link_to: function(name, url, html_options){
            if(!name) name = 'null';
            if(!html_options) html_options = {};
            html_options.onclick = html_options.onclick  || '' ;

            if(html_options.confirm){
                html_options.onclick =
                    " var ret_confirm = confirm(\""+html_options.confirm+"\"); if(!ret_confirm){ return false;} "
                html_options.confirm = null;
            }

            html_options.value = name;
            html_options.type = 'submit';
            html_options.onclick=html_options.onclick+(url ? this.url_for(url) : '')+'return false;';
            //html_options.href='#'+(options ? Routes.url_for(options) : '')
            return this.start_tag_for('input', html_options)
        },
        link_to_if: function(condition, name, url, html_options, post, block) {
            return this.link_to_unless((condition == false), name, url, html_options, post, block);
        },
        link_to_unless: function(condition, name, url, html_options, block) {
            html_options = html_options || {};
            if(condition) {
                if(block && typeof block == 'function') {
                    return block(name, url, html_options, block);
                } else {
                    return name;
                }
            } else return this.link_to(name, url, html_options);
        },
        link_to_unless_current: function(name, url, html_options, block) {
            html_options = html_options || {};
            return this.link_to_unless(this.is_current_page(url), name, url, html_options, block)
        },
        password_field_tag: function(name, value, html_options) {
            return this.input_field_tag(name, value, 'password', html_options);
        },
        select_tag: function(name, value, choices, html_options) {
            html_options = html_options || {};
            html_options.id  = html_options.id  || name;
            html_options.value = value;
            html_options.name = name;

            var txt = '';
            txt += this.start_tag_for('select', html_options);

            for(var i = 0; i < choices.length; i++)
            {
                var choice = choices[i];
                var optionOptions = {value: choice.value};
                if(choice.value == value)
                    optionOptions.selected ='selected';
                txt += this.start_tag_for('option', optionOptions )+choice.text+this.tag_end('option')
            }
            txt += this.tag_end('select');
            return txt;
        },
        single_tag_for: function(tag, html_options) { return this.tag(tag, html_options, '/>');},
        start_tag_for: function(tag, html_options)  { return this.tag(tag, html_options); },
        submit_tag: function(name, html_options) {
            html_options = html_options || {};
            //html_options.name  = html_options.id  || 'commit';
            html_options.type = html_options.type  || 'submit';
            html_options.value = name || 'Submit';
            return this.single_tag_for('input', html_options);
        },
        tag: function(tag, html_options, end) {
            var value;
            if(!end) end = '>';
            var txt = ' ';
            for(var attr in html_options) {
                if(html_options[attr] != null)
                    value = html_options[attr].toString();
                else
                    value='';
                if(attr == "Class") // special case because "class" is a reserved word in IE
                    attr = "class";
                if( value.indexOf("'") != -1 )
                    txt += attr+'=\"'+value+'\" ';
                else
                    txt += attr+"='"+value+"' "
            }
            return '<'+tag+txt+end;
        },
        tag_end: function(tag) { return '</'+tag+'>'; },
        text_area_tag: function(name, value, html_options) {
            html_options = html_options || {};
            html_options.id  = html_options.id  || name;
            html_options.name  = html_options.name  || name;
            value = value || '';
            if(html_options.size) {
                html_options.cols = html_options.size.split('x')[0];
                html_options.rows = html_options.size.split('x')[1];
                delete html_options.size
            }
            html_options.cols = html_options.cols  || 50;
            html_options.rows = html_options.rows  || 4;
            return  this.start_tag_for('textarea', html_options)+value+this.tag_end('textarea')
        },
        text_field_tag: function(name, value, html_options) { return this.input_field_tag(name, value, 'text', html_options);},
        url_for: function(url) { return 'window.location="'+url+'";' },
        img_tag: function(image_location, alt, options){
            options = options || {};
            options.src = image_location;
            options.alt = alt;
            return this.single_tag_for('img', options)
        }
    };

    if (typeof module !== 'undefined' && module.exports) { // Most probably we are running under Node.JS
        module.exports = EJS;
        global.EJS = EJS;
        EJS.prototype.getUrl = EJS.prototype.nodeXfer;
        fs = require('fs'); // TODO: To verify how to avoid preloading with requirejs
    } else if (typeof define !== 'undefined' && typeof requirejs !== 'undefined') { // we are running under requirejs
        define(function(require,exports,module) {
            return EJS;
        });
        EJS.prototype.getUrl = EJS.prototype.browserXfer;
    }
    else {
        global.EJS = EJS; // Export it to the global namespace
        EJS.prototype.getUrl = EJS.prototype.browserXfer;
    }

})(this);
