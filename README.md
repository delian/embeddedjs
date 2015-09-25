# Reimplementation of the Embedded JS from http://embeddedjs.com

Hello to all. I love the Embedded JS. It is simple, fast and functional.
But it is not supported and updated for a while.
Of course there are lot other embedded javascript implementations,
but most of them are hard to use or also out of support.
This is not a problem by itself, but the web browsers evolve and we synchronous XMLHttpRequest is not supported anymore in the main thread.
Which means the EJS has to be rewritten to be asynchronous.
And as I need it asynchronous, I wrote the code in ES5 which essentially makes it faster and much simpler.

So welcome to the new asynchronous and modern EJS implementation.

## Install Async Embedded JS

### Install with Bower

To install EJS with Bower you just have to do:

    bower install async-embeddedjs

To load it in the scripts you have to do:

    <SCRIPT SRC="bower_components/async-embeddedjs/EJS.js"></SCRIPT>

Or you can load it with (AMD) requirejs like:

    require.config({
        paths: {
            'EJS': 'bower_components/async-embeddedjs/EJS.js'
        }
    });
    
    require(['EJS'],function(EJS) {
        ....
    });
    
    or
    
    var EJS = require('EJS');

### Install with Node's npm

To install EJS with npm you jush have to do:

    npm install async-embeddedjs

To load it you can do something like this:

    var EJS = require('async-embeddedjs');

### Download it

Ot you can just download EJS.js or the minified version EJS.min.js

## Performance

This reimplementation is twice shorter and faster than the original EJS code.
The produced JS code for the templates is cached and never regenerated (unless the template is changed), precompiled (with Function) and only executed when parameters are applied. This makes it lighting-fast.

## Usage

### Use with templates

Like ERB, JavaScript between <% %> is executed. JavaScript between <%= %> adds HTML to the result.

Syntax:

    // load a template file, then render it with data
    new EJS({
        url: '/template.ejs',
        success: function(template) {
            template.render(data);
        }
    });

Pre-cache template:

    template = new EJS({url: '/mytemplate.ejs'})

Refresh template:

    new EJS({
        url: '/template.ejs',
        success: function(template) {
            setTimeout(function() {
                template.refresh();
            }, 15000);
        }
    });

Update element:

    template.update('element',data);

Where data can be null, object or 'url' to a JSON file from where we read the content

### Template examples

The templates are HTML (or XML) containing <% %> tags:

    <DIV>
       <% for (var i = 10; i; i--) { %>
           TEST!!!
       <% } %>
    </DIV>

    <TITLE><%= title %></TITLE>

    <DIV>
       <% for (var i = 10; i; i--) { %>
           <A HREF="<%=links[i]%>"></A>
       <% } %>
    </DIV>

