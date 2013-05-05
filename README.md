BoxledJS: Tiled => EaselJS + Box2DWeb
================

## What is BoxledJS?
BoxledJS is a framework that sits on top of your EaselJS project and parses&creates your map from Tiled. Aditionally BoxledJS will automatically setup a Box2D-world will all collision tiles ect., it parse things like force-fields. It is also possible to define a class for any object placed in Tiled and BoxledJS will automatically create an instance from that class when the map is loaded.

## What is BoxledJS not?
A gamemaker.

## How do I use it?
1. Create your Level/Map with Tiled(http://mapeditor.org)
2. Export the map to JSON (File -> Export as...)
3. In your EaselJS-project use: `stage.addChild(new boxledjs.Map(jsonData));`

![ScreenShot](https://raw.github.com/olsn/BoxledJS/master/examples/basic_usage/screenshot_basic_usage.jpg)

For further use check the example(more soon)

## Important Note
This project is in an early stage, it will work on a basic level, however a lot of features are not implemented yet (e.g. there is **currently no support for isometric maps**). Also the majority of the code is not properly documented yet. This and more examples will follow soon.
Feel free to use it, but please don't expect me to implement your desired feature right away ;-)

## License
The BoxledJS-framework is released under a MIT License with the exception of all example assets.