define([
        //dojo
        "dojo/_base/declare",
        "jimu/BaseWidget",
        "dijit/form/ToggleButton",
        "dojo/dom",
        "dojo/dom-construct",
        "dijit/registry",
        "dijit/form/Button",
        "dojo/on",
        "dojo/aspect",
        "dijit/form/SimpleTextarea",
        "dojo/_base/Color",
        "dijit/MenuBar",
        "dijit/PopupMenuBarItem",
        "dijit/Menu",
        "dijit/MenuItem",
        "dijit/DropDownMenu",
        "dojo/dom-class",
        "dojo/_base/json",
        "dojo/_base/array",
        "dojo/string",
        "dojo/_base/lang",
        "dojo/Deferred",
        'dijit/registry',
        'dojo/promise/all',

        //esri
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'esri/config',
        "esri/graphicsUtils",
        "esri/InfoTemplate",
        "esri/tasks/GeometryService",
        "esri/geometry/Geometry",
        "esri/geometry/Point",
        "esri/tasks/ProjectParameters",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/toolbars/draw",
        "esri/map",
        "esri/layers/FeatureLayer",
        "esri/request",
        "dojo/domReady!",
        "./widgets/Enhanced%20Query/jquery-1.11.3.min.js" //jquery rocks
    ],
    function(
        //dojo
        declare, BaseWidget, ToggleButton, dom, domConstruct, registry, Button, on, aspect, SimpleTextarea, Color,
        MenuBar, PopupMenuBarItem, Menu, MenuItem, DropDownMenu,
        domClass, dojoJson, array, dojoString, lang, Deferred, registry, all,

        //esri
        WidgetManager, PanelManager, esriConfig, graphicsUtils, InfoTemplate, GeometryService, Geometry, Point, ProjectParameters, Query, QueryTask,
        SimpleLineSymbol,
        SimpleFillSymbol,
        SimpleMarkerSymbol,
        Draw,
        map,
        FeatureLayer,
        esriRequest) {

        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {

            // this property is be set by the framework when widget is loaded.
            baseClass: 'jimu-widget-EnhancedQuery',
            name: "Enhanced Query",
            label: "Enhanced Query",


            postCreate: function() {
                this.inherited(arguments);
                console.log('postCreate');
                  //  this.config = config; ?? from eSearch??
                  

            },

            startup: function startupFunc() {


                this.inherited(arguments);
                map = this.map;

                //// Widget startup function Scope  'mini globals' vars ///
                var esriRequestLayerInfoURL,
                    requestHandleLayer,
                    queryTask,
                    optionLayerSelVal,
                    layerInfoLayerList,
                    optionLayer,
                    optionLayerSel,
                    optionLayerSelText,
                    optionLayerCurrentSelectedValue,
                    layerInfoLayerListName,
                    percentPlaceHolder,
                    percentPlaceHolder2,
                    optionSelectedOperatorMathMenu,
                    layerQuery,
                    serviceQuery,
                    fieldInfoName,
                    optionFieldSel,
                    optionField,
                    aLayer,
                    currentLayer,
                    layerIndex; //To Do: scope these better with closures that pass scope up later
                var that = this;

/////////////////

                function openResultInAttributeTable() {
                    // To Do: implement passing eQuery results to Attrib Table 
                };

                var textareaTest = new SimpleTextarea({
                    name: "myarea",
                    rows: "5",
                    cols: "30",
                    style: "width:auto; height: auto"
                }, "myarea").startup();

                var textareaExpression = new SimpleTextarea({
                    name: "myareaExpression",
                    rows: "5",
                    cols: "30",
                    style: "width:auto; height: auto"
                }, "myareaExpression").startup();

                ///exec query Search button
                btnSearch = dom.byId("btnSearchNode");
                handlerExecQuery = function() {
                    queryTask.url = serviceQuery + optionLayerSelVal;
                    queryTask._url.path = serviceQuery + optionLayerSelVal;
                 //come back later and fix this to define this before exec 
                    executeQueryTask();
                };
                on(btnSearch, "click", handlerExecQuery);

                ///clear graphics button
                btnClearGfx = dom.byId("btnClearGfxNode");
                handlerClearGfx = function() {
                    map.graphics.clear();
                };
                on(btnClearGfx, "click", handlerClearGfx);

                //set widget globals 
                //scope better later?
                //serviceQuery = 'use hardcoded layer here';
                serviceQuery = this.config.configText;
                serviceQuery = serviceQuery.replace(/\/?$/, '/'); // test to add trailing / character only if it's missing  

                layerQuery = '';
                layerQuery = this.config.configText2;
                console.log("layer Selected:  " + layerQuery);

                // layerQuery = "1"; ///// hardcoded
                querySuffix = "/query?f=json&where=";
                esriRequestLayerInfoURL = serviceQuery + layerQuery;
                layerSuffix = '?f=json&pretty=true';
                layerConfig = this.config.layers;
                var fieldMenu = dom.byId("fieldMenuNode");
                var selectField = dom.byId("selectFieldNode");
                var selectFieldNodeDojo = dom.byId(selectFieldNode);


                var layerMenu = dom.byId("layerMenuNode");
                var selectLayer = dom.byId("selectLayerNode");

                var selectOperatorMathMenu = dom.byId("selectOperatorMathMenuNode");

                on(selectOperatorMathMenu, "click",
                    function _setOptionOperatorVar() {
                        optionSelectedOperatorMathMenu = selectOperatorMathMenu.options[selectOperatorMathMenu.selectedIndex].text;
                        console.log("Operator Math Menu clicked ... " + optionSelectedOperatorMathMenu);
                    });

                btnClearQueryBox = dom.byId("btnClearQueryBoxNode");
                on(btnClearQueryBox, "click", function() {
                    myarea.value = "";
                });

                ////// Operators  ////
                btnOr = dom.byId("btnOrNode");
                on(btnOr, "click", function() {
                    dojo.byId("myarea").value += " OR ";
                });

                btnAnd = dom.byId("btnAndNode");
                on(btnAnd, "click", function() {
                    dojo.byId("myarea").value += " AND ";
                });

                btnNot = dom.byId("btnNotNode");
                on(btnNot, "click", function() {
                    dojo.byId("myarea").value += " NOT ";
                });


                //// Get layer list ////
                var requestHandleLayerList = esri.request({
                    "url": serviceQuery,
                    "content": {
                        "f": "json"
                    },
                    "callbackParamName": "callback",
                });
                requestHandleLayerList.then(requestSucceededLayerList, requestFailedLayerList);

                function requestSucceededLayerList(response, io) {

                    // show layer indexes and names
                    if (response.hasOwnProperty("layers")) {
                        layerInfoLayerList = dojo.map(response.layers, function(f) {
                            return f;
                        });
                        layerInfoLayerListName = [];
                        for (var i = 0; i < layerInfoLayerList.length; i++) {
                            layerInfoLayerListName[i] = layerInfoLayerList[i].name;
                        }

                        optionLayerCurrentSelectedValue = [];

                        /////populate layer dropdown menu
                        for (var i = 0; i < layerInfoLayerList.length; i++) {
                            optionLayer = document.createElement("option");
                            optionLayer.value = i;
                            optionLayer.text = layerInfoLayerListName[i];
                            selectLayerNode.appendChild(optionLayer);
                            selectLayerNode.selectedIndex = layerQuery;
                            optionLayerSelVal = layerQuery; ////
                        }

                        var arrayHide = [
                                  "0",
                                  "1",
                                  "2",
                                  "3",
                                  "4",
                                  "5",
                                  "6",
                                  "7",
                                  "8",
                                  "9",
                                  "10",
                                  "11",
                                  "12",
                                  "13",
                                  "14",
                                  "15",
                                  "16",
                                  "17",
                                  "18",
                                  "19",
                                  "20",
                                  "21",
                                  "22",
                                  "23",
                                  "24",
                                  "25",
                                  "26",
                                  "27",
                                  "28",
                                  "29",
                                  "30",
                                  "31",
                                  "32",
                                  "33",
                                  "34",
                                  "35",
                                  "38",
                                  "39",
                                  "40",
                                  "41",
                                  "42",
                                  "44",
                                  "45",
                                  "47",
                                  "48",
                                  "49",
                                  "51",
                                  "52",
                                  "53",
                                  "54",
                                  "56",
                                  "57",
                                  "58",
                                  "59",
                                  "61",
                                  "62",
                                  "63",
                                  "64",
                                  "66",
                                  "67",
                                  "68",
                                  "69",
                                  "71",
                                  "72",
                                  "73",
                                  "74",
                                  "76",
                                  "77",
                                  "78",
                                  "80",
                                  "81",
                                  "82",
                                  "84",
                                  "85",
                                  "86",
                                  "88",
                                  "89",
                                  "90",
                                  "92",
                                  "93",
                                  "94",
                                  "96",
                                  "97",
                                  "98",
                                  "99",
                                  "101",
                                  "102",
                                  "103",
                                  "105",
                                  "106",
                                  "107",
                                  "109",
                                  "110",
                                  "111",
                                  "113",
                                  "114",
                                  "115",
                                  "116",
                                  "117",
                                  "119",
                                  "120",
                                  "121",
                                  "122",
                                  "123",
                                  "126",
                                  "127",
                                  "128",
                                  "129",
                                  "130",
                                  "131",
                                  "132",
                                  "133",
                                  "134",
                                  "135",
                                  "136",
                                  "137",
                                  "143",
                                  "144",
                                  "145",
                                  "146",
                                  "147",
                                  "148",
                                  "149",
                                  "150",
                                  "151",
                                  "152"
                        ];

                        function hideOptions(array) { //jQuery
                            for (var i = 0; i < array.length; i++) {
                                $('#selectLayerNode option[value="' + array[i] + '"]').hide();
                                //wrap('<span>'). goes before hide above to make it work in IE //but then it moves the value of .text for Field of selected //layer to be the index of dropdown not or REST point, in other //words it sends all the layers to Annotation layers or layers //without fields.. the array being from 0 to 26 now instead of 0 //to 150 or so,  because instead of hiding... using Wrap actually //REMOVES the array items
                            }
                        }

                     //   hideOptions(arrayHide);   //re-activate 

                    } else {
                        console.log("Failed to get layer list. inside Else");
                    }
                }

                function requestFailedLayerList() {
                    console.log("Failed to get layer list. ");
                } //end of Get Layer List routines


//////   get field list /////
                requestHandleLayer = esriRequest({
                    "url": serviceQuery + layerQuery,
                    "content": {
                        "f": "json"
                    },
                    "callbackParamName": "callback"
                });
                requestHandleLayer.then(requestSucceeded, requestFailed);

                function requestSucceeded(response, io) {
                    if (response.hasOwnProperty("fields")) {
                        fieldInfoName = array.map(response.fields, function(f) {
                            return f.name;
                        });

                        /////populate field dropdown menu
                        for (var i = 0; i < fieldInfoName.length; i++) {
                            optionField = document.createElement("option");
                            optionField.value = fieldInfoName[i];
                            optionField.text = fieldInfoName[i];
                            selectFieldNode.appendChild(optionField);
                            selectFieldNode.selectedIndex = 1; //arbitrarily hardwiring it to layer '1'.. change to whatever you'd like
                        }
                        optionFieldSel = optionField.text;
                    } else {
                        console.log("No field info found. Please double-check the URL.");
                    }
                }

                function requestFailed(error, io) {
                    console.log("Getting Layer List JSON failed");
                } ///end of Get Field list routines

                //get user's selected field
                on(selectField, "click", function() {
                    optionFieldSel = selectFieldNode.options[selectFieldNode.selectedIndex].text;
                });


                //get user's selected layer
                on(selectLayer, "click", function() {
                    optionLayerSelVal = selectLayerNode.options[selectLayerNode.selectedIndex].value;
                    optionLayerSelText = selectLayerNode.options[selectLayerNode.selectedIndex].text;

                    console.log(' on(selectLayer, "click"  index value of layer ::: ' + optionLayerSelVal); ////
                    console.log(' on(selectLayer, "click"  text of selected index element ::   ' + optionLayerSelText); ////

                    /////////////////


//////   get field list  AFTER clicking layer list menu to change layer
                    requestHandleLayer2 = esriRequest({
                        "url": serviceQuery + optionLayerSelVal,
                        "content": {
                            "f": "json"
                        },
                        "callbackParamName": "callback"
                    });
                    requestHandleLayer2.then(requestSucceeded2, requestFailed2);
                    var layerConfig = {
                        url: serviceQuery + optionLayerSelVal,
                        name: "INSERT LAYER NAME", //needs to be a var
                        objectIdField: "SHAPE.fid" ///this needs to be a variable populated by what the active layer uses..not sure how to pull this yet but it's necessary because they are NOT all using this field on the BOA 2015 service on saint-2

                    };

                    layerIndex = optionLayerSelVal;

                    //layerConfig.url = serviceQuery + optionLayerSelVal;
                    function requestSucceeded2(response, io) {
                        if (response.hasOwnProperty("fields")) {
                            fieldInfoName = array.map(response.fields, function(f) {
                                return f.name;
                            });

                            /////populate field dropdown menu
                            $("#selectFieldNode option").each(function() {
                                $(this).remove();
                            });

                            for (var i = 0; i < fieldInfoName.length; i++) {
                                optionField = document.createElement("option");
                                optionField.value = fieldInfoName[i];
                                optionField.text = fieldInfoName[i];
                                selectFieldNode.appendChild(optionField);
                                selectFieldNode.selectedIndex = 1; //arbitrarily hardwiring it to layer '1'.. change to whatever you'd like
                            }
                            optionFieldSel = optionField.text;
                        } else {
                            console.log("No field info found. Please double-check the URL.");
                        }
                    }

                    function requestFailed2(error, io) {
                        console.log("Getting Layer List JSON failed");
                    } ///end field list  INSIDE get layer list routine
                    //////////////////////////
                }); //end of onClick hanlder for layer list menu

                //create symbol for selected features
                symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                        new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 255, 0, 0.5]));

                btnAddToQuery = dom.byId("btnAddToQueryNode");
                on(btnAddToQuery, "click", function() {


                    optionFieldSel = selectFieldNode.options[selectFieldNode.selectedIndex].text;

                    console.log(" outside the if, but after Button Click: array index of Field Selected: =   " + selectFieldNode.selectedIndex);

                    if (optionSelectedOperatorMathMenu === "LIKE") {
                        percentPlaceHolder = " '%";
                        percentPlaceHolder2 = "%'";
                    } else {
                        percentPlaceHolder = "";
                        percentPlaceHolder2 = "";
                    }


                    userQueryTextExpressionTxtArea = dom.byId("myareaExpression").value;
                    userQueryTextExpressionTotal = optionFieldSel + " " + optionSelectedOperatorMathMenu
                        + percentPlaceHolder + userQueryTextExpressionTxtArea + percentPlaceHolder2;


                    dojo.byId("myarea").value += userQueryTextExpressionTotal;
                    ////make sure after this...put in event here to CLEAR myarea2
                });

                infoTemplate = new InfoTemplate(
                    "Details", "${*}"
                ); ////come back, make {*} wildcare for all attribs except block shape and ObjectID fields using pattern from airport site

                queryTask = new esri.tasks.QueryTask(serviceQuery + '1');   // layerId hardcoded for now but will be updated on execution

                query = new Query();

                ///   var q = new esri.tasks.Query();
                query.returnGeometry = true;
                query.outSpatialReference = map.spatialReference;
                query.outFields = ['*'];

                function executeQueryTask() { //make this array of fieldnames from dropdown instead of hardwired TO DO*******

                    userQueryText = dom.byId("myarea").value;
                    //set query based on what user typed in for population;

                    query.where = userQueryText;

                    //execute query
                    queryTask.execute(query, showResults);

                } ////end executeQuerytask func

                function showResults(featureSet) {

                    //Performance enhancer - assign featureSet array to a single variable.
                    var resultFeatures = featureSet.features;
                    
                    if (resultFeatures.length == 0) {
                        alert('No results found.');
                    } else {
                        map.graphics.clear();
                        var extent = esri.graphicsExtent(resultFeatures);
                        map.setExtent(extent); //zoom to query results





                    /////new
                    layerArray = [];
                    ///////


                    geometryTypeQuery = featureSet.geometryType;
                    
                      markerSymbolQuery = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 11,
                          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                          new Color([255,0,0]), 1),
                          new Color([111,211,55,1]));
                    
                      lineSymbolQuery = new SimpleLineSymbol(
      SimpleLineSymbol.STYLE_DASH,
      new Color([255,0,0]),
      3);

                      polygonSymbolQuery = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
    new Color([222, 0, 0]), 1), new Color([255, 255, 0, 0.25])
  );

                      
                    var symbolQuery;

                    switch (geometryTypeQuery) {
                        case "esriGeometryPoint":
                            symbolQuery = markerSymbolQuery;
                            break;
                        case "esriGeometryPolyline":
                            symbolQuery = lineSymbolQuery;
                            break;
                        case "esriGeometryPolygon":
                            symbolQuery = polygonSymbolQuery;
                            break;
        default:
            lineSymbolQuery = polygonSymbolQuery;
    }


                    //create a feature collection for the flickr photos
                    var featureCollection = {
                        "layerDefinition": null,
                        "featureSet": {
                            "features": resultFeatures,
                            "geometryType": geometryTypeQuery
                        }
                    };
                    featureCollection.layerDefinition = {
                        "geometryType": geometryTypeQuery,
                        "objectIdField": "OBJECTID", // set this to a var? maybe it is not always the same? but how to know??
                        "drawingInfo": {
                            "renderer": symbolQuery
                  
                        },
                        "fields": 
                            featureSet.fields
                        
                    };

                    QuerylayerArguments = dojo.byId("myarea").value;
                    
                    infoTemplateQuery = new InfoTemplate("Details", "${*}");   // wildcard for all fields.  Specifiy particular fields here if desired.
                        console.log('featurecollection: ' + featureCollection);
                    //create a feature layer based on the feature collection
                        featureLayer = new FeatureLayer(featureCollection, {
                            id: 'Query of layer &nbsp;' + '"' + optionLayerSelText + '" &nbsp;' + 'Where: &nbsp;' + '"' + QuerylayerArguments + '"',
                               infoTemplate: infoTemplateQuery  
                        });

                      //  featureLayer.setSelectionSymbol(symbolQuery);
                       // featureLayer.selectFeatures(featureCollection);

                        map.addLayers([featureLayer]);
                        console.log('featureLayer: ' + featureLayer);



                        /////temporary way try add graphics because featureLayer symbology above doesn't seem to work and the layer comes in 'invisible' even though it works for popups and attrib table 


                        //Loop through each feature returned
                        for (var i = 0, il = resultFeatures.length; i < il; i++) {
                            //Get the current feature from the featureSet.
                            //Feature is a graphic
                            var graphic = resultFeatures[i];
                            graphic.setSymbol(symbolQuery);

                            //Set the infoTemplate.
                            graphic.setInfoTemplate(infoTemplateQuery);  //workaround...dont need this? since featureLayer has popup?

                            //Add graphic to the map graphics layer.
                            map.graphics.add(graphic);
                        }

                        ///end map graphics workaround


                        //// *****  new  ADD TO ATTRIBUTE TABLE ////*****   (a la Robert's eSearch Widget....Credits go in part to Robert for code and advice)
                        function openResultInAttributeTable(featureLayer) {

                            aLayer = {
                                layerObject: featureLayer,
                                title: optionLayer.text, //// hmm is  optionField.text right to pull from or should i use jQuery to pull the currently selected value (element[index] or whatever] from the dropdown HTML element to get the current layer's name 'text'  ???           //** replace with current layer name** //currentLayer.name,
                                id: optionLayerSelVal,
                                url: serviceQuery,
                                getLayerObject: function () {
                                    return this.layerObject;
                                }};

                            if (!Object.create) {
                                Object.create = function (proto, props) {
                                    if (typeof props !== "undefined") {
                                        throw "The multiple-argument version of Object.create is not provided by this browser and cannot be shimmed.";
                                    }
                                    function ctor() { }
                                    ctor.prototype = proto;
                                    return new ctor();
                                };}

                            publishDataFunc();
                        };

                        // attribTableBarEQ = $(".jimu-widget-attributetable-bar");
                        
                        var attWidget = that.widgetManager.getWidgetsByName('AttributeTable');
                        if (attWidget[0]) {
                              attWidget[0].__proto__._openTable().then(
                            lang.hitch(that, openResultInAttributeTable, layerArray)  );
                        }


                        openResultInAttributeTable();
                        /////// ************** END of Add to Attribute Table section ******************///////////////


                    




                    }  //////  end of If test of resultFeatures.length == 0 to check if No Results Found ////// *****U //////
                    ////To Do:  do some better error handling. with Dojo dialogue box. Also don't map.setExtent below if no results found.


                } ///end showResults////


                optionSelectedOperatorMathMenu = "LIKE";

                var publishDataFunc = (function() {
                    /// gotta get this back into Search click handler handlerQueryExec handler or whatever its called... i just moved this out to get this.PublishData scoped

                    that.publishData({
                        'target': 'AttributeTable',
                        'layer': Object.create(aLayer)
                    });
                });


                console.log('startup');
              

            },
            //////////////////////
            onOpen: function() {
                console.log('onOpen');

            },

            onClose: function() {
                //   map.graphics.clear();   /// NOT SURE if we want to do this... 
                console.log('onClose');
            },

            onMinimize: function() {
                console.log('onMinimize');
            },

            onMaximize: function() {
                console.log('onMaximize');
            },

            onSignIn: function(credential) {
                /* jshint unused:false*/
                console.log('onSignIn');
            },

            onSignOut: function() {
                console.log('onSignOut');
            }
        });
    });