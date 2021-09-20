import os
import sys
import json

from flask import Flask, flash, jsonify, render_template, request, redirect, url_for, send_from_directory
from werkzeug import secure_filename
from flask_assets import Environment, Bundle
from livereload import Server

# App setup

app = Flask(__name__)

assets = Environment(app)
 
# https://github.com/lepture/python-livereload/issues/144
app.debug = True
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.secret_key = 'some_secret'
import_active ='active'
project_name = 'TWIFFA'


#layout_option = 'left-nav' #Left Nav
layout_option =  'top-bars' #Top Bars

#Choose Color Theme

#color_theme = 'dark'
color_theme = 'light'


# Tell flask-assets where to look for assets

assets.load_path = [
  os.path.join(os.path.dirname(__file__), 'static'),
  os.path.join(os.path.dirname(__file__), 'node_modules'),
]

# Preprocess scss and bundle CSS
css = Bundle(
  # Paths to CSS dependencies you don't want to run through scss go here
  Bundle(
    'styles/font.css',
    'bootstrap/dist/css/bootstrap.css',
    'fonts/all.css',
    'styles/a-layout.css',
    'styles/b-typography.css',
    'styles/c-colors.css',
    'styles/error.scss',
    'styles/style.css',
    filters = 'scss',
  ),
  output = 'css_all.css'
)

assets.register('css_all', css)

# Bundle JS

js = Bundle(
  'jquery/dist/jquery.js',
  'moment/moment.js',
  'scripts/popper.js',
  'bootstrap/dist/js/bootstrap.js',
  'cytoscape/dist/cytoscape.min.js',
  'scripts/d3.min.js',
  'scripts/app.js',
  'scripts/config.js',
  'scripts/nodeedgechart.js',
  output = 'js_all.js'
)

assets.register('js_all', js)
path = os.path.expanduser(u'./')


# Functions    

# Pages 
@app.route('/')
def page_1():
  return render_template('page_1.html', tree=make_tree(path), colorTheme = color_theme, webLayout = layout_option, projectName = project_name)

#Scripts for individual pages
@app.route('/page_1_script.js')
def page_1_script():
    return render_template('/page_1_script.js')


#example link
@app.route('/link_example')  
def link_example(): 
    return render_template('link_example.html', tree=make_tree(path), class_example=import_active)

def make_tree(path):
    tree = dict(name=os.path.basename(path), children=[])
    try: lst = os.listdir(path)
    except OSError:
        pass #ignore errors
    else:
        for name in lst:
            fn = os.path.join(path, name)
            if os.path.isdir(fn):
                tree['children'].append(make_tree(fn))
            else:
                url = os.path.join('/uploads', name)
                tree['children'].append(dict(name=name, url=url))
    return tree

#error pages
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

# Endpoints
@app.route('/_get_data')
def getData():
  return # Query DB, third-party service, etc here


# Init
if __name__ == '__main__':
  app.jinja_env.auto_reload = True

  # remember to use DEBUG mode for templates auto reload
  # https://github.com/lepture/python-livereload/issues/144
  app.debug = True
  #app.config['ASSETS_DEBUG'] = True

  server = Server(app.wsgi_app)
  # server.watch

  server.serve()


  #todo - set this up for production only!
  # Parse the user command line to get the url and port
  #usrCmd = sys.argv[1]
  #(usrHost, usrPort) = usrCmd.split(':')
  #server.serve(host=usrHost, port=usrPort)