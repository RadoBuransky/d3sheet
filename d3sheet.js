(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.d3sheet = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
!function() {
    checkRequirements();

    var d3sheet = {
        ver: "1.0.0",
        svgContainerId: "",
        infoContainerId: "",
        svg: {},
        spreadsheet: {},
        model: {}
    };

    module.exports = d3sheet;

    /**
    * Initialize D3 sheet.
    * @param {string} containerId - identifier of the main DIV.
    **/
    d3sheet.init = function(svgContainerId, infoContainerId) {
        if (svgContainerId == null)
            svgContainerId = "d3sheet-svg";
        d3sheet.svgContainerId = svgContainerId;

        if (infoContainerId == null)
            infoContainerId = "d3sheet-info";
        d3sheet.infoContainerId = infoContainerId;

        var svgContainer = $("#" + svgContainerId),
            width = svgContainer.width(),
            height = svgContainer.height();

        var zoom = d3.behavior.zoom()
            .on("zoom", rescale);

        var svg = d3.select("#" + svgContainerId)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .call(zoom);

        var rect = svg.append("rect")
                    .attr("width", width)
                    .attr("height", height)
                    .style("fill", "none")
                    .style("pointer-events", "all");

        d3sheet.svg = svg.append("g");

        d3.select("#" + infoContainerId)
            .append("div");

        return d3sheet;
    }

    function rescale() {
      var trans = d3.event.translate;
      var scale = d3.event.scale;

      d3sheet.svg.attr("transform",
          "translate(" + trans + ")"
          + " scale(" + scale + ")");
    }

    /**
    * Load data from spreadsheet.
    **/
    d3sheet.load = function(spreadsheetKey) {
        // Load spreadsheet
        var spreadsheet = require("./spreadsheet");
        spreadsheet(spreadsheetKey, function(spreadsheet) {
            console.log(spreadsheet);

            d3sheet.spreadsheet = spreadsheet;

            // Initialize document
            document.title = spreadsheet.title;

            // Initialize info section
            var infoModule = require("./info");
            var info = infoModule(d3sheet.infoContainerId, spreadsheet.title);

            // Create model from spreadsheet
            var modelModule = require("./model");
            d3sheet.model = modelModule(d3sheet.spreadsheet);

            console.log(d3sheet.model);

            // Create graph from model
            var graphModule = require("./graph");
            d3sheet.graph = graphModule(d3sheet.model);

            console.log(d3sheet.graph);

            // Create D3 force layout from graph
            var forceModule = require("./force");
            var force = forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info, d3sheet.model.settings);

            // Initialize view options
//            var viewModule = require("./view");
//            viewModule(d3sheet.model, updateGraph);
//
//            function updateGraph(viewOptions) {
//                // TODO: update d3sheet.graph and force.restart()
//            }

            // Apply CSS style
            applyCss(d3sheet.model.settings.css);
        });
    }

    function applyCss(css) {
        if (css == null)
            return;

        // Get all element selectors
        var selectors = Object.keys(css);
        $.each(selectors, function(i, selector) {
            var elements = {};
            if (selector.slice(0, 1) == "#")
                // It is an identifier
                elements = $(selector);
            else
                // Is is a class
                elements = $("." + selector);

            // Get all style properties
            var properties = Object.keys(css[selector]);
            $.each(properties, function(j, property) {
                elements.css(property, css[selector][property]);
            });
        });
    }

    function checkRequirements() {
        if (typeof d3 === "undefined")
            throw new Error("D3 library not found!");
        if (typeof $ === "undefined")
            throw new Error("jQuery not found!");
    }
}();
},{"./force":2,"./graph":3,"./info":4,"./model":5,"./spreadsheet":6}],2:[function(require,module,exports){
module.exports = function(graph, svgContainerId, svg, info, settings) {
    var node = [],
        nodeLabel = [],
        link = [],
        linkLabel = [],
        colors = d3.scale.category20();

    var svgContainer = $("#" + svgContainerId),
        width = svgContainer.width(),
        height = svgContainer.height();

    selectAll();

    var force = d3.layout.force()
        .size([width, height])
        .linkDistance(170) // TODO: Move to settings
        .charge(-5000) // TODO: Move to settings
        .gravity(0.3) // TODO: Move to settings
        .nodes(graph.nodes)
        .links(graph.links)
        .on("tick", onTick);

    var drag = force.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    this.restart = restart
    restart();

    function dragstarted(d) {
       d3.event.sourceEvent.stopPropagation();
       d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
       d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
       d3.select(this).classed("dragging", false);
    }

    function restart() {
        svg.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("class", "link");

        svg.selectAll(".link-label")
            .data(graph.links)
            .enter()
            .append("text")
            .text(function(graphLink) { return graphLink.label; })
            .attr("class", "link-label")
            .attr("text-anchor", "middle");

        svg.selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("circle")
            .attr("class", nodeClass)
            .attr("r", 20) // TODO: Settings
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("fill", nodeFillColor)
            .call(force.drag)
            .on("click", nodeClick);

        svg.selectAll(".node-label")
            .data(graph.nodes)
            .enter()
            .append("text")
            .attr("class", "node-label")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(graphNode) { return graphNode.node.label(); })
            .call(force.drag)
            .on("click", nodeClick);

        selectAll();
        force.start();
    }

    function nodeClass(graphNode) {
        return "node " + graphNode.node.nodeGroup.name;
    }

    function nodeClick(graphNode) {
        info.showNode(graphNode.node, nodeFillColor(graphNode));
    }

    function nodeFillColor(graphNode) {
        return settings.css.get(graphNode.node.nodeGroup.name + ".fill", colors(graphNode.node.nodeGroup.name));
    }

    function selectAll() {
        node = svg.selectAll(".node");
        nodeLabel = svg.selectAll(".node-label");
        link = svg.selectAll(".link");
        linkLabel = svg.selectAll(".link-label");
    }

    function onTick() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        linkLabel
            .attr("x", function(d) {
                return (d.source.x + d.target.x)/2; })
            .attr("y", function(d) {
                return (d.source.y + d.target.y)/2; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        nodeLabel
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    }

    return this;
}
},{}],3:[function(require,module,exports){
module.exports = function(model) {
    var graph = new Graph();

    // For all sheets
    $.each(model.nodeGroups.items, function(i, nodeGroup) {
        // For all nodes
        $.each(nodeGroup.nodes, function(j, node) {
            // Add node to graph
            var graphNode = new GraphNode(node);
            graph.nodes.push(graphNode);
        });
    });

    // Create links
    $.each(graph.nodes, function(i, graphNode) {
        $.each(graphNode.node.refs, function(j, ref) {
            graph.links.push(new GraphLink(graphNode, getGraphNode(ref.targetNode), ref.label));
        });
    });

    function getGraphNode(node) {
        var result = null;
        $.each(graph.nodes, function(i, graphNode) {
            if (graphNode.node == node) {
                result = graphNode;
                return false;
            }
        });
        return result;
    }

    return graph;
}

function Graph() {
    this.nodes = [];
    this.links = [];
    return this;
}

function GraphNode(node) {
    this.node = node;
    return this;
}

function GraphLink(source, target, label) {
    this.source = source;
    this.target = target;
    this.label = label;
    return this;
}
},{}],4:[function(require,module,exports){
module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node, fillColor) {
        $("#d3sheet-node-info h2").text(node.heading());
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.nodeGroup.name);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        $.each(node.properties, function(i, nodeProperty) {
            if (!nodeProperty.isHidden)
                addProperty(nodeProperty.name, nodeProperty.value);
        });

        // Group node links
        var groupedLinks = {};
        $.each(node.refs, function(i, ref) {
            var linkName = ref.targetNode.nodeGroup.name;

            if (groupedLinks[linkName] == null)
                groupedLinks[linkName] = [];

            groupedLinks[linkName].push(ref.targetNode.heading());
        });

        // Show node links
        var linkNames = Object.keys(groupedLinks);
        $.each(linkNames, function(i, linkName) {
            addProperty(linkName, groupedLinks[linkName].join(", "));
        });

        function addProperty(name, value) {
            ul.append("<li><span class=\"d3sheet-node-property-name\">" + name +
                ":</span> <span class=\"d3sheet-node-property-value\">" + formatValue(value) + "</span></li>");
        }

        function formatValue(value) {
            if (value.slice(0, "4").toLowerCase() == "http")
                return "<a href=\"" + value + "\">" + value + "</a>"

            return value;
        }
    }

    return this;
}
},{}],5:[function(require,module,exports){
module.exports = function(spreadsheet) {
    var model = new Model();

    var nodeGroupTypes = getNodeGroupTypes(spreadsheet);
    model.nodeGroups = getNodeGroups(spreadsheet, nodeGroupTypes.nodeGroupNames, nodeGroupTypes.refSheetNames);
    if (nodeGroupTypes.settingsGroupName != null)
        model.settings = getSettings(spreadsheet.sheets[nodeGroupTypes.settingsGroupName]);

    function getSettings(settingsSheet) {
        var settings = new Settings();

        $.each(settingsSheet.rows, function(i, row) {
            var key = row.rowCells[0].value,
                value = row.rowCells[1].value;

            if ((key == null) || (value == null))
                return;

            var path = key.split(".");
            var current = settings;
            $.each(path, function(j, k) {
                if (current[k] == null) {
                    if (j == path.length - 1)
                        current[k] = value;
                    else
                        current[k] = new Settings();
                }
                current = current[k];
            });
        });

        return settings;
    }

    function getNodeGroups(spreadsheet, nodeGroupNames, refSheetNames) {
        // Create nodes with properties
        var nodeGroups = new NodeGroups();
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            nodeGroups.items.push(getNodes(spreadsheet.sheets[nodeGroupName], nodeGroupName));
        });

        // Create references from node sheets
        $.each(nodeGroups.items, function(i, nodeGroup) {
            createRefs(nodeGroups, spreadsheet.sheets[nodeGroup.name], nodeGroup);
        });

        // Create references from reference sheets
        $.each(refSheetNames, function(i, refSheetName) {
            createSheetRefs(nodeGroups, spreadsheet.sheets[refSheetName.name], refSheetName);
        });

        function createSheetRefs(nodeGroups, refSheet, refSheetName) {
            var colNames = refSheet.header();

            // For all sheet rows
            $.each(refSheet.rows, function(i, row) {
                if (i == 0)
                    return;

                var source = getRefToNodeGroup(nodeGroups, refSheet, row, refSheetName.source);
                var target = getRefToNodeGroup(nodeGroups, refSheet, row, refSheetName.target);
                if ((source != null) &&
                    (target != null)) {
                    var label = target.label;
                    if (((target.label == null) ||
                        (target.label == "")) &&
                        (row.rowCells[0].colIndex == 0)) {
                            label = row.rowCells[0].value;
                        }

                    $.each(source.nodes, function(j, sourceRef) {
                        $.each(target.nodes, function(k, targetRef) {
                            sourceRef.targetNode.refs.push(new Ref(targetRef.targetNode, label));
                        });
                    });
                }
            });
        }

        function getRefToNodeGroup(nodeGroups, sheet, row, nodeGroupName) {
            var result = null;
            var colNames = sheet.header();
            $.each(colNames, function(j, colName) {
                var value = sheet.value(row, colName);
                if (value == null)
                    return;

                var refTarget = parseColumnRefName(colName, nodeGroups);
                if ((refTarget != null) &&
                    (refTarget.nodeGroup.name == nodeGroupName)) {
                    result = refTarget;
                    result.nodes = [];

                    // Find index of the target node
                    $.each(refTarget.nodeGroup.nodes, function(k, targetNode) {
                        // If target node property value matches
                        if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                            result.nodes.push(new Ref(targetNode, refTarget.label));
                        }
                    });

                    return false;
                }
            });
            return result;
        }

        function createRefs(nodeGroups, nodeSheet, nodeGroup) {
            var colNames = nodeSheet.header();

            // For all sheet rows
            $.each(nodeSheet.rows, function(i, row) {
                if (i == 0)
                    return;

                // For all sheet columns
                $.each(colNames, function(j, colName) {
                    var value = nodeSheet.value(row, colName);
                    if (value == null)
                        return;

                    // If this is a reference column
                    var refTarget = parseColumnRefName(colName, nodeGroups);
                    if (refTarget != null) {
                        // Find index of the target node
                        $.each(refTarget.nodeGroup.nodes, function(k, targetNode) {
                            // If target node property value matches
                            // TODO: We should properly split values using comma
                            if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                                nodeGroup.nodes[i - 1].refs.push(new Ref(targetNode, refTarget.label));
                            }
                        });
                    }
                });
            });
        }

        function getNodes(nodeSheet, nodeGroupName) {
            var header = nodeSheet.header();
            var result = new NodeGroup(nodeGroupName, header[0]);

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                if (i == 0)
                    return;
                result.nodes.push(new Node(getNodeProperties(row, header), result));
            });

            return result;
        }

        function getNodeProperties(row, header) {
            var nodeProperties = [];
            $.each(row.rowCells, function(i, rowCell) {
                var colName = header[rowCell.colIndex];
                if (colName.indexOf(".") == -1)
                    nodeProperties.push(new NodeProperty(colName, rowCell.value));
            });
            return nodeProperties;
        }

        return nodeGroups;
    }

    function getNodeGroupTypes(spreadsheet) {
        var nodeGroupTypes = {
            nodeGroupNames: [],
            refSheetNames: [],
            settingsGroupName: null
        };
        var sheetNames = Object.keys(spreadsheet.sheets);
        $.each(sheetNames, function(i, sheetName) {
            if (sheetName == "settings") {
                nodeGroupTypes.settingsGroupName = sheetName;
                return;
            }

            if (sheetName.slice(0, 1) == "#")
                return;

            var refSheet = parseRefSheetName(sheetName)
            if ((refSheet != null) &&
                (sheetNames.indexOf(refSheet.source) > -1) &&
                (sheetNames.indexOf(refSheet.target) > -1)) {
                nodeGroupTypes.refSheetNames.push(refSheet);
                return;
            }

            nodeGroupTypes.nodeGroupNames.push(sheetName);
        });

        return nodeGroupTypes;
    }

    function parseColumnRefName(colName, nodeGroups) {
        var refNames = colName.split(".");
        var nodeGroup = null;
        if (refNames.length > 0)
            nodeGroup = nodeGroups.getByName(refNames[0]);
        if ((refNames.length >= 2) &&
            (nodeGroup != null)) {
            var result = {
                nodeGroup: nodeGroup,
                propertyName: refNames[1]
            }

            if (refNames.length == 3)
                result.label = refNames[2];

            return result;
        }

        return null;
    }

    function parseRefSheetName(sheetName) {
        var nodeNames = sheetName.split("-");
        if (nodeNames.length == 2) {
            return {
                name: sheetName,
                source: nodeNames[0],
                target: nodeNames[1]
            };
        }

        return null;
    }

    return model;
}

function Model() {
    this.nodeGroups = new NodeGroups();
    this.settings = {};
    return this;
}

function NodeGroups() {
    this.items = [];
    return this;
}

NodeGroups.prototype.getByName = function(nodeGroupName) {
    var result = null;
    $.each(this.items, function(i, nodeGroup) {
        if (nodeGroup.name == nodeGroupName) {
            result = nodeGroup;
            return false;
        }
    });
    return result;
}

function NodeGroup(name, labelPropertyName) {
    this.name = name;
    this.labelPropertyName = labelPropertyName;
    this.nodes = [];
    return this;
}

function Node(properties, nodeGroup) {
    this.properties = properties;
    this.refs = [];
    this.nodeGroup = nodeGroup;
    return this;
}

Node.prototype.value = function(propertyName) {
    var result = null;
    $.each(this.properties, function(i, property) {
        if (property.name == propertyName) {
            result = property.value;
            return false;
        }
    });
    return result;
}

Node.prototype.label = function() {
    return this.value(this.nodeGroup.labelPropertyName);
}

Node.prototype.heading = function() {
    var result = "";
    $.each(this.properties, function(i, property) {
        if (property.isHeading) {
            result = property.value;
            return false;
        }
    });

    if (result != "")
        return result;

    return this.label();
}

function NodeProperty(name, value) {
    this.name = name.replace("*", "").replace("#", "");
    this.value = value;
    this.isHeading = (name.slice(0, 1) == "*");
    this.isHidden = (name.slice(0, 1) == "#");
    return this;
}

function Ref(targetNode, label) {
    this.targetNode = targetNode;
    this.label = label;
    return this;
}

function Settings() {
    return this;
}

Settings.prototype.get = function(key, defaultValue) {
    var parts = key.split(".");
    if (parts.length > 1) {
        if (this[parts[0]] == null)
            return defaultValue;

        return this[parts[0]].get(parts.splice(1, parts.length - 1).join("."), defaultValue);
    }

    if (this[key] == null)
        return defaultValue;

    return this[key];
}
},{}],6:[function(require,module,exports){
module.exports = function(spreadsheetKey, onLoaded) {
    // Get sheet count
    getSpreadsheetInfo(spreadsheetKey, function onSuccess(info) {
        // Load all sheets
        loadSheets(spreadsheetKey, info);
    });

    function loadSheets(spreadsheetKey, info) {
        var spreadsheet = new Spreadsheet(spreadsheetKey, info.title);
        var loadedSheetCount = 0;
        for (i = 1; i <= info.sheetCount; i++) {
            loadSheet(spreadsheet, spreadsheetKey, i).then(function() {
                loadedSheetCount += 1;
                if (loadedSheetCount == info.sheetCount) {
                    onLoaded(spreadsheet);
                }
            })
        }
    }

    function loadSheet(spreadsheet, spreadsheetKey, sheetIndex) {
        return getSheet(spreadsheetKey, sheetIndex, function(response) {
            var sheet = spreadsheet.sheets[response.feed.title.$t] = new Sheet();

            $.each(response.feed.entry, function(i, e) {
                var index = e.gs$cell.row - 1;
                if (sheet.rows[index] == null) {
                    sheet.rows[index] = new Row(index);
                }
                sheet.rows[index].rowCells.push(new RowCell(e.gs$cell.col - 1, e.content.$t));
            });

            // Sort row cells by col index
            $.each(sheet.rows, function(i, row) {
                row.rowCells.sort(function(c1, c2) { return c1.colIndex - c2.colIndex; });
            });
        });
    }

    function getSheet(spreadsheetKey, sheetIndex, onSuccess) {
        return $.ajax({
            url: "https://spreadsheets.google.com/feeds/cells/" + spreadsheetKey + "/" + sheetIndex + "/public/values?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: onSuccess
        });
    }

    function getSpreadsheetInfo(spreadsheetKey, onSuccess) {
        $.ajax({
            url: "https://spreadsheets.google.com/feeds/worksheets/" + spreadsheetKey + "/public/full?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: function(response) {
                var info = {
                    sheetCount: response.feed.entry.length,
                    title: response.feed.title.$t
                };
                onSuccess(info);
            }
        });
    }
}

function Spreadsheet(spreadsheetKey, title) {
    this.key = spreadsheetKey;
    this.title = title;
    this.sheets = new Sheets();

    return this;
}

function Sheets() {
    return this;
}

function Sheet() {
    this.rows = [];
    return this;
}

Sheet.prototype.header = function() {
    return this.rows[0].values();
}

Sheet.prototype.value = function(row, colName) {
    var colIndex = this.header().indexOf(colName);
    if (colIndex == -1)
        return null;

    var result = null;
    $.each(row.rowCells, function(i, rowCell) {
        if (rowCell.colIndex == colIndex) {
            result = rowCell.value;
            return false;
        }
    });

    return result;
}

function Row(rowIndex) {
    this.rowIndex = rowIndex;
    this.rowCells = [];

    return this;
}

Row.prototype.values = function() {
    return $.map(this.rowCells, function(rowCell, i) {
        return rowCell.value;
    });
}

function RowCell(colIndex, value) {
    this.colIndex = colIndex;
    this.value = value;
    return this;
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xyXG4gICAgY2hlY2tSZXF1aXJlbWVudHMoKTtcclxuXHJcbiAgICB2YXIgZDNzaGVldCA9IHtcclxuICAgICAgICB2ZXI6IFwiMS4wLjBcIixcclxuICAgICAgICBzdmdDb250YWluZXJJZDogXCJcIixcclxuICAgICAgICBpbmZvQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgc3ZnOiB7fSxcclxuICAgICAgICBzcHJlYWRzaGVldDoge30sXHJcbiAgICAgICAgbW9kZWw6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcclxuXHJcbiAgICAvKipcclxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cclxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gaWRlbnRpZmllciBvZiB0aGUgbWFpbiBESVYuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcclxuICAgICAgICBpZiAoc3ZnQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XHJcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XHJcbiAgICAgICAgZDNzaGVldC5pbmZvQ29udGFpbmVySWQgPSBpbmZvQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIHZhciB6b29tID0gZDMuYmVoYXZpb3Iuem9vbSgpXHJcbiAgICAgICAgICAgIC5vbihcInpvb21cIiwgcmVzY2FsZSk7XHJcblxyXG4gICAgICAgIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcclxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmFwcGVuZChcImdcIilcclxuICAgICAgICAgICAgLmNhbGwoem9vbSk7XHJcblxyXG4gICAgICAgIHZhciByZWN0ID0gc3ZnLmFwcGVuZChcInJlY3RcIilcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcclxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIFwibm9uZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwiYWxsXCIpO1xyXG5cclxuICAgICAgICBkM3NoZWV0LnN2ZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xyXG5cclxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XHJcblxyXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlc2NhbGUoKSB7XHJcbiAgICAgIHZhciB0cmFucyA9IGQzLmV2ZW50LnRyYW5zbGF0ZTtcclxuICAgICAgdmFyIHNjYWxlID0gZDMuZXZlbnQuc2NhbGU7XHJcblxyXG4gICAgICBkM3NoZWV0LnN2Zy5hdHRyKFwidHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICBcInRyYW5zbGF0ZShcIiArIHRyYW5zICsgXCIpXCJcclxuICAgICAgICAgICsgXCIgc2NhbGUoXCIgKyBzY2FsZSArIFwiKVwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQubG9hZCA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5KSB7XHJcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHJlcXVpcmUoXCIuL3NwcmVhZHNoZWV0XCIpO1xyXG4gICAgICAgIHNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICBkM3NoZWV0LnNwcmVhZHNoZWV0ID0gc3ByZWFkc2hlZXQ7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIGRvY3VtZW50XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnRpdGxlID0gc3ByZWFkc2hlZXQudGl0bGU7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIGluZm8gc2VjdGlvblxyXG4gICAgICAgICAgICB2YXIgaW5mb01vZHVsZSA9IHJlcXVpcmUoXCIuL2luZm9cIik7XHJcbiAgICAgICAgICAgIHZhciBpbmZvID0gaW5mb01vZHVsZShkM3NoZWV0LmluZm9Db250YWluZXJJZCwgc3ByZWFkc2hlZXQudGl0bGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGVsIGZyb20gc3ByZWFkc2hlZXRcclxuICAgICAgICAgICAgdmFyIG1vZGVsTW9kdWxlID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XHJcbiAgICAgICAgICAgIGQzc2hlZXQubW9kZWwgPSBtb2RlbE1vZHVsZShkM3NoZWV0LnNwcmVhZHNoZWV0KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGdyYXBoIGZyb20gbW9kZWxcclxuICAgICAgICAgICAgdmFyIGdyYXBoTW9kdWxlID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XHJcbiAgICAgICAgICAgIGQzc2hlZXQuZ3JhcGggPSBncmFwaE1vZHVsZShkM3NoZWV0Lm1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQuZ3JhcGgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBmb3JjZU1vZHVsZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xyXG4gICAgICAgICAgICB2YXIgZm9yY2UgPSBmb3JjZU1vZHVsZShkM3NoZWV0LmdyYXBoLCBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkLCBkM3NoZWV0LnN2ZywgaW5mbywgZDNzaGVldC5tb2RlbC5zZXR0aW5ncyk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZpZXcgb3B0aW9uc1xyXG4vLyAgICAgICAgICAgIHZhciB2aWV3TW9kdWxlID0gcmVxdWlyZShcIi4vdmlld1wiKTtcclxuLy8gICAgICAgICAgICB2aWV3TW9kdWxlKGQzc2hlZXQubW9kZWwsIHVwZGF0ZUdyYXBoKTtcclxuLy9cclxuLy8gICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVHcmFwaCh2aWV3T3B0aW9ucykge1xyXG4vLyAgICAgICAgICAgICAgICAvLyBUT0RPOiB1cGRhdGUgZDNzaGVldC5ncmFwaCBhbmQgZm9yY2UucmVzdGFydCgpXHJcbi8vICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQXBwbHkgQ1NTIHN0eWxlXHJcbiAgICAgICAgICAgIGFwcGx5Q3NzKGQzc2hlZXQubW9kZWwuc2V0dGluZ3MuY3NzKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseUNzcyhjc3MpIHtcclxuICAgICAgICBpZiAoY3NzID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gR2V0IGFsbCBlbGVtZW50IHNlbGVjdG9yc1xyXG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSBPYmplY3Qua2V5cyhjc3MpO1xyXG4gICAgICAgICQuZWFjaChzZWxlY3RvcnMsIGZ1bmN0aW9uKGksIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHt9O1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3Iuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICAvLyBJdCBpcyBhbiBpZGVudGlmaWVyXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAvLyBJcyBpcyBhIGNsYXNzXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoXCIuXCIgKyBzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIHN0eWxlIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhjc3Nbc2VsZWN0b3JdKTtcclxuICAgICAgICAgICAgJC5lYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uKGosIHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5jc3MocHJvcGVydHksIGNzc1tzZWxlY3Rvcl1bcHJvcGVydHldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlbWVudHMoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBkMyA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgJCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IG5vdCBmb3VuZCFcIik7XHJcbiAgICB9XHJcbn0oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdyYXBoLCBzdmdDb250YWluZXJJZCwgc3ZnLCBpbmZvLCBzZXR0aW5ncykge1xyXG4gICAgdmFyIG5vZGUgPSBbXSxcclxuICAgICAgICBub2RlTGFiZWwgPSBbXSxcclxuICAgICAgICBsaW5rID0gW10sXHJcbiAgICAgICAgbGlua0xhYmVsID0gW10sXHJcbiAgICAgICAgY29sb3JzID0gZDMuc2NhbGUuY2F0ZWdvcnkyMCgpO1xyXG5cclxuICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpO1xyXG5cclxuICAgIHZhciBmb3JjZSA9IGQzLmxheW91dC5mb3JjZSgpXHJcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxyXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMTcwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmNoYXJnZSgtNTAwMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ncmF2aXR5KDAuMykgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ub2RlcyhncmFwaC5ub2RlcylcclxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgLm9uKFwidGlja1wiLCBvblRpY2spO1xyXG5cclxuICAgIHZhciBkcmFnID0gZm9yY2UuZHJhZygpXHJcbiAgICAgICAgLm9yaWdpbihmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KVxyXG4gICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBkcmFnc3RhcnRlZClcclxuICAgICAgICAub24oXCJkcmFnXCIsIGRyYWdnZWQpXHJcbiAgICAgICAgLm9uKFwiZHJhZ2VuZFwiLCBkcmFnZW5kZWQpO1xyXG5cclxuICAgIHRoaXMucmVzdGFydCA9IHJlc3RhcnRcclxuICAgIHJlc3RhcnQoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBkcmFnc3RhcnRlZChkKSB7XHJcbiAgICAgICBkMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHJhZ2dpbmdcIiwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ2dlZChkKSB7XHJcbiAgICAgICBkMy5zZWxlY3QodGhpcykuYXR0cihcImN4XCIsIGQueCA9IGQzLmV2ZW50LngpLmF0dHIoXCJjeVwiLCBkLnkgPSBkMy5ldmVudC55KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmFnZW5kZWQoZCkge1xyXG4gICAgICAgZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJkcmFnZ2luZ1wiLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVzdGFydCgpIHtcclxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIilcclxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgICAgIC5lbnRlcigpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpO1xyXG5cclxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIilcclxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgICAgIC5lbnRlcigpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGdyYXBoTGluaykgeyByZXR1cm4gZ3JhcGhMaW5rLmxhYmVsOyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluay1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xyXG5cclxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIilcclxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgICAgIC5lbnRlcigpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBub2RlQ2xhc3MpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCAyMCkgLy8gVE9ETzogU2V0dGluZ3NcclxuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgbm9kZUZpbGxDb2xvcilcclxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcclxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihncmFwaE5vZGUpIHsgcmV0dXJuIGdyYXBoTm9kZS5ub2RlLmxhYmVsKCk7IH0pXHJcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXHJcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XHJcblxyXG4gICAgICAgIHNlbGVjdEFsbCgpO1xyXG4gICAgICAgIGZvcmNlLnN0YXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9kZUNsYXNzKGdyYXBoTm9kZSkge1xyXG4gICAgICAgIHJldHVybiBcIm5vZGUgXCIgKyBncmFwaE5vZGUubm9kZS5ub2RlR3JvdXAubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub2RlQ2xpY2soZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgaW5mby5zaG93Tm9kZShncmFwaE5vZGUubm9kZSwgbm9kZUZpbGxDb2xvcihncmFwaE5vZGUpKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub2RlRmlsbENvbG9yKGdyYXBoTm9kZSkge1xyXG4gICAgICAgIHJldHVybiBzZXR0aW5ncy5jc3MuZ2V0KGdyYXBoTm9kZS5ub2RlLm5vZGVHcm91cC5uYW1lICsgXCIuZmlsbFwiLCBjb2xvcnMoZ3JhcGhOb2RlLm5vZGUubm9kZUdyb3VwLm5hbWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XHJcbiAgICAgICAgbm9kZSA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKTtcclxuICAgICAgICBub2RlTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGUtbGFiZWxcIik7XHJcbiAgICAgICAgbGluayA9IHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKTtcclxuICAgICAgICBsaW5rTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25UaWNrKCkge1xyXG4gICAgICAgIGxpbmsuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lnk7IH0pO1xyXG5cclxuICAgICAgICBsaW5rTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnkgKyBkLnRhcmdldC55KS8yOyB9KTtcclxuXHJcbiAgICAgICAgbm9kZVxyXG4gICAgICAgICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pO1xyXG5cclxuICAgICAgICBub2RlTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XHJcbiAgICB2YXIgZ3JhcGggPSBuZXcgR3JhcGgoKTtcclxuXHJcbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xyXG4gICAgJC5lYWNoKG1vZGVsLm5vZGVHcm91cHMuaXRlbXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cCkge1xyXG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEFkZCBub2RlIHRvIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBncmFwaE5vZGUgPSBuZXcgR3JhcGhOb2RlKG5vZGUpO1xyXG4gICAgICAgICAgICBncmFwaC5ub2Rlcy5wdXNoKGdyYXBoTm9kZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgbGlua3NcclxuICAgICQuZWFjaChncmFwaC5ub2RlcywgZnVuY3Rpb24oaSwgZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgJC5lYWNoKGdyYXBoTm9kZS5ub2RlLnJlZnMsIGZ1bmN0aW9uKGosIHJlZikge1xyXG4gICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKG5ldyBHcmFwaExpbmsoZ3JhcGhOb2RlLCBnZXRHcmFwaE5vZGUocmVmLnRhcmdldE5vZGUpLCByZWYubGFiZWwpKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGdldEdyYXBoTm9kZShub2RlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcclxuICAgICAgICAgICAgaWYgKGdyYXBoTm9kZS5ub2RlID09IG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdyYXBoTm9kZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdyYXBoO1xyXG59XHJcblxyXG5mdW5jdGlvbiBHcmFwaCgpIHtcclxuICAgIHRoaXMubm9kZXMgPSBbXTtcclxuICAgIHRoaXMubGlua3MgPSBbXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBHcmFwaE5vZGUobm9kZSkge1xyXG4gICAgdGhpcy5ub2RlID0gbm9kZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBHcmFwaExpbmsoc291cmNlLCB0YXJnZXQsIGxhYmVsKSB7XHJcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcclxuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluZm9Db250YWluZXJJZCwgdGl0bGUpIHtcclxuICAgIC8vIFNldCBoZWFkaW5nXHJcbiAgICAkKFwiI1wiICsgaW5mb0NvbnRhaW5lcklkICsgXCIgaDFcIikudGV4dCh0aXRsZSk7XHJcblxyXG4gICAgdGhpcy5zaG93Tm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGZpbGxDb2xvcikge1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmhlYWRpbmcoKSk7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLXNoZWV0LW5hbWVcIikudGV4dChub2RlLm5vZGVHcm91cC5uYW1lKTtcclxuXHJcbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcclxuICAgICAgICB1bC5lbXB0eSgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xyXG4gICAgICAgICQuZWFjaChub2RlLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIG5vZGVQcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVQcm9wZXJ0eS5pc0hpZGRlbilcclxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnR5KG5vZGVQcm9wZXJ0eS5uYW1lLCBub2RlUHJvcGVydHkudmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHcm91cCBub2RlIGxpbmtzXHJcbiAgICAgICAgdmFyIGdyb3VwZWRMaW5rcyA9IHt9O1xyXG4gICAgICAgICQuZWFjaChub2RlLnJlZnMsIGZ1bmN0aW9uKGksIHJlZikge1xyXG4gICAgICAgICAgICB2YXIgbGlua05hbWUgPSByZWYudGFyZ2V0Tm9kZS5ub2RlR3JvdXAubmFtZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChncm91cGVkTGlua3NbbGlua05hbWVdID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdID0gW107XHJcblxyXG4gICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdLnB1c2gocmVmLnRhcmdldE5vZGUuaGVhZGluZygpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU2hvdyBub2RlIGxpbmtzXHJcbiAgICAgICAgdmFyIGxpbmtOYW1lcyA9IE9iamVjdC5rZXlzKGdyb3VwZWRMaW5rcyk7XHJcbiAgICAgICAgJC5lYWNoKGxpbmtOYW1lcywgZnVuY3Rpb24oaSwgbGlua05hbWUpIHtcclxuICAgICAgICAgICAgYWRkUHJvcGVydHkobGlua05hbWUsIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0uam9pbihcIiwgXCIpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdWwuYXBwZW5kKFwiPGxpPjxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktbmFtZVxcXCI+XCIgKyBuYW1lICtcclxuICAgICAgICAgICAgICAgIFwiOjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcImQzc2hlZXQtbm9kZS1wcm9wZXJ0eS12YWx1ZVxcXCI+XCIgKyBmb3JtYXRWYWx1ZSh2YWx1ZSkgKyBcIjwvc3Bhbj48L2xpPlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSgwLCBcIjRcIikudG9Mb3dlckNhc2UoKSA9PSBcImh0dHBcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIjxhIGhyZWY9XFxcIlwiICsgdmFsdWUgKyBcIlxcXCI+XCIgKyB2YWx1ZSArIFwiPC9hPlwiXHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xyXG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKCk7XHJcblxyXG4gICAgdmFyIG5vZGVHcm91cFR5cGVzID0gZ2V0Tm9kZUdyb3VwVHlwZXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgbW9kZWwubm9kZUdyb3VwcyA9IGdldE5vZGVHcm91cHMoc3ByZWFkc2hlZXQsIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzLCBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzKTtcclxuICAgIGlmIChub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSAhPSBudWxsKVxyXG4gICAgICAgIG1vZGVsLnNldHRpbmdzID0gZ2V0U2V0dGluZ3Moc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cFR5cGVzLnNldHRpbmdzR3JvdXBOYW1lXSk7XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2V0dGluZ3Moc2V0dGluZ3NTaGVldCkge1xyXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IG5ldyBTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAkLmVhY2goc2V0dGluZ3NTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IHJvdy5yb3dDZWxsc1swXS52YWx1ZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gcm93LnJvd0NlbGxzWzFdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKChrZXkgPT0gbnVsbCkgfHwgKHZhbHVlID09IG51bGwpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhdGggPSBrZXkuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IHNldHRpbmdzO1xyXG4gICAgICAgICAgICAkLmVhY2gocGF0aCwgZnVuY3Rpb24oaiwgaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRba10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChqID09IHBhdGgubGVuZ3RoIC0gMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IG5ldyBTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRba107XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMsIHJlZlNoZWV0TmFtZXMpIHtcclxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIG5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICBub2RlR3JvdXBzLml0ZW1zLnB1c2goZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSByZWZlcmVuY2VzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cC5uYW1lXSwgbm9kZUdyb3VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSByZWZlcmVuY2Ugc2hlZXRzXHJcbiAgICAgICAgJC5lYWNoKHJlZlNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHJlZlNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBjcmVhdGVTaGVldFJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW3JlZlNoZWV0TmFtZS5uYW1lXSwgcmVmU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlU2hlZXRSZWZzKG5vZGVHcm91cHMsIHJlZlNoZWV0LCByZWZTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gcmVmU2hlZXQuaGVhZGVyKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcclxuICAgICAgICAgICAgJC5lYWNoKHJlZlNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGdldFJlZlRvTm9kZUdyb3VwKG5vZGVHcm91cHMsIHJlZlNoZWV0LCByb3csIHJlZlNoZWV0TmFtZS5zb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGdldFJlZlRvTm9kZUdyb3VwKG5vZGVHcm91cHMsIHJlZlNoZWV0LCByb3csIHJlZlNoZWV0TmFtZS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChzb3VyY2UgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAodGFyZ2V0ICE9IG51bGwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gdGFyZ2V0LmxhYmVsO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgoKHRhcmdldC5sYWJlbCA9PSBudWxsKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAodGFyZ2V0LmxhYmVsID09IFwiXCIpKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocm93LnJvd0NlbGxzWzBdLmNvbEluZGV4ID09IDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IHJvdy5yb3dDZWxsc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goc291cmNlLm5vZGVzLCBmdW5jdGlvbihqLCBzb3VyY2VSZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHRhcmdldC5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0UmVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VSZWYudGFyZ2V0Tm9kZS5yZWZzLnB1c2gobmV3IFJlZih0YXJnZXRSZWYudGFyZ2V0Tm9kZSwgbGFiZWwpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0UmVmVG9Ob2RlR3JvdXAobm9kZUdyb3Vwcywgc2hlZXQsIHJvdywgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gc2hlZXQuaGVhZGVyKCk7XHJcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gc2hlZXQudmFsdWUocm93LCBjb2xOYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVmVGFyZ2V0ID0gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChyZWZUYXJnZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAocmVmVGFyZ2V0Lm5vZGVHcm91cC5uYW1lID09IG5vZGVHcm91cE5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVmVGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ub2RlcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChyZWZUYXJnZXQubm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YodGFyZ2V0Tm9kZS52YWx1ZShyZWZUYXJnZXQucHJvcGVydHlOYW1lKSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2gobmV3IFJlZih0YXJnZXROb2RlLCByZWZUYXJnZXQubGFiZWwpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVmcyhub2RlR3JvdXBzLCBub2RlU2hlZXQsIG5vZGVHcm91cCkge1xyXG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBub2RlU2hlZXQuaGVhZGVyKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbm9kZVNoZWV0LnZhbHVlKHJvdywgY29sTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHJlZmVyZW5jZSBjb2x1bW5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVmVGFyZ2V0ID0gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWZUYXJnZXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gocmVmVGFyZ2V0Lm5vZGVHcm91cC5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgbWF0Y2hlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3Blcmx5IHNwbGl0IHZhbHVlcyB1c2luZyBjb21tYVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YodGFyZ2V0Tm9kZS52YWx1ZShyZWZUYXJnZXQucHJvcGVydHlOYW1lKSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVHcm91cC5ub2Rlc1tpIC0gMV0ucmVmcy5wdXNoKG5ldyBSZWYodGFyZ2V0Tm9kZSwgcmVmVGFyZ2V0LmxhYmVsKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaGVhZGVyID0gbm9kZVNoZWV0LmhlYWRlcigpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE5vZGVHcm91cChub2RlR3JvdXBOYW1lLCBoZWFkZXJbMF0pO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IG5vZGVzIGFuZCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5ub2Rlcy5wdXNoKG5ldyBOb2RlKGdldE5vZGVQcm9wZXJ0aWVzKHJvdywgaGVhZGVyKSwgcmVzdWx0KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVQcm9wZXJ0aWVzKHJvdywgaGVhZGVyKSB7XHJcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IFtdO1xyXG4gICAgICAgICAgICAkLmVhY2gocm93LnJvd0NlbGxzLCBmdW5jdGlvbihpLCByb3dDZWxsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29sTmFtZSA9IGhlYWRlcltyb3dDZWxsLmNvbEluZGV4XTtcclxuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQcm9wZXJ0aWVzLnB1c2gobmV3IE5vZGVQcm9wZXJ0eShjb2xOYW1lLCByb3dDZWxsLnZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZVByb3BlcnRpZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbm9kZUdyb3VwcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCkge1xyXG4gICAgICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IHtcclxuICAgICAgICAgICAgbm9kZUdyb3VwTmFtZXM6IFtdLFxyXG4gICAgICAgICAgICByZWZTaGVldE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgc2V0dGluZ3NHcm91cE5hbWU6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQuc2hlZXRzKTtcclxuICAgICAgICAkLmVhY2goc2hlZXROYW1lcywgZnVuY3Rpb24oaSwgc2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUgPT0gXCJzZXR0aW5nc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSA9IHNoZWV0TmFtZTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHZhciByZWZTaGVldCA9IHBhcnNlUmVmU2hlZXROYW1lKHNoZWV0TmFtZSlcclxuICAgICAgICAgICAgaWYgKChyZWZTaGVldCAhPSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC5zb3VyY2UpID4gLTEpICYmXHJcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKHJlZlNoZWV0LnRhcmdldCkgPiAtMSkpIHtcclxuICAgICAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLnJlZlNoZWV0TmFtZXMucHVzaChyZWZTaGVldCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzLnB1c2goc2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGVHcm91cFR5cGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uUmVmTmFtZShjb2xOYW1lLCBub2RlR3JvdXBzKSB7XHJcbiAgICAgICAgdmFyIHJlZk5hbWVzID0gY29sTmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgdmFyIG5vZGVHcm91cCA9IG51bGw7XHJcbiAgICAgICAgaWYgKHJlZk5hbWVzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIG5vZGVHcm91cCA9IG5vZGVHcm91cHMuZ2V0QnlOYW1lKHJlZk5hbWVzWzBdKTtcclxuICAgICAgICBpZiAoKHJlZk5hbWVzLmxlbmd0aCA+PSAyKSAmJlxyXG4gICAgICAgICAgICAobm9kZUdyb3VwICE9IG51bGwpKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICBub2RlR3JvdXA6IG5vZGVHcm91cCxcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogcmVmTmFtZXNbMV1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlZk5hbWVzLmxlbmd0aCA9PSAzKVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmxhYmVsID0gcmVmTmFtZXNbMl07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VSZWZTaGVldE5hbWUoc2hlZXROYW1lKSB7XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lcyA9IHNoZWV0TmFtZS5zcGxpdChcIi1cIik7XHJcbiAgICAgICAgaWYgKG5vZGVOYW1lcy5sZW5ndGggPT0gMikge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogc2hlZXROYW1lLFxyXG4gICAgICAgICAgICAgICAgc291cmNlOiBub2RlTmFtZXNbMF0sXHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IG5vZGVOYW1lc1sxXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1vZGVsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBNb2RlbCgpIHtcclxuICAgIHRoaXMubm9kZUdyb3VwcyA9IG5ldyBOb2RlR3JvdXBzKCk7XHJcbiAgICB0aGlzLnNldHRpbmdzID0ge307XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZUdyb3VwcygpIHtcclxuICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5Ob2RlR3JvdXBzLnByb3RvdHlwZS5nZXRCeU5hbWUgPSBmdW5jdGlvbihub2RlR3JvdXBOYW1lKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICQuZWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcclxuICAgICAgICBpZiAobm9kZUdyb3VwLm5hbWUgPT0gbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBub2RlR3JvdXA7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVHcm91cChuYW1lLCBsYWJlbFByb3BlcnR5TmFtZSkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMubGFiZWxQcm9wZXJ0eU5hbWUgPSBsYWJlbFByb3BlcnR5TmFtZTtcclxuICAgIHRoaXMubm9kZXMgPSBbXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlKHByb3BlcnRpZXMsIG5vZGVHcm91cCkge1xyXG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gcHJvcGVydGllcztcclxuICAgIHRoaXMucmVmcyA9IFtdO1xyXG4gICAgdGhpcy5ub2RlR3JvdXAgPSBub2RlR3JvdXA7XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuTm9kZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eU5hbWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBudWxsO1xyXG4gICAgJC5lYWNoKHRoaXMucHJvcGVydGllcywgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcclxuICAgICAgICBpZiAocHJvcGVydHkubmFtZSA9PSBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gcHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbk5vZGUucHJvdG90eXBlLmxhYmVsID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZSh0aGlzLm5vZGVHcm91cC5sYWJlbFByb3BlcnR5TmFtZSk7XHJcbn1cclxuXHJcbk5vZGUucHJvdG90eXBlLmhlYWRpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciByZXN1bHQgPSBcIlwiO1xyXG4gICAgJC5lYWNoKHRoaXMucHJvcGVydGllcywgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcclxuICAgICAgICBpZiAocHJvcGVydHkuaXNIZWFkaW5nKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHJlc3VsdCAhPSBcIlwiKVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMubGFiZWwoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZVByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lLnJlcGxhY2UoXCIqXCIsIFwiXCIpLnJlcGxhY2UoXCIjXCIsIFwiXCIpO1xyXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgdGhpcy5pc0hlYWRpbmcgPSAobmFtZS5zbGljZSgwLCAxKSA9PSBcIipcIik7XHJcbiAgICB0aGlzLmlzSGlkZGVuID0gKG5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJlZih0YXJnZXROb2RlLCBsYWJlbCkge1xyXG4gICAgdGhpcy50YXJnZXROb2RlID0gdGFyZ2V0Tm9kZTtcclxuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTZXR0aW5ncygpIHtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5TZXR0aW5ncy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsdWUpIHtcclxuICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdChcIi5cIik7XHJcbiAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIGlmICh0aGlzW3BhcnRzWzBdXSA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpc1twYXJ0c1swXV0uZ2V0KHBhcnRzLnNwbGljZSgxLCBwYXJ0cy5sZW5ndGggLSAxKS5qb2luKFwiLlwiKSwgZGVmYXVsdFZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpc1trZXldID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHJcbiAgICByZXR1cm4gdGhpc1trZXldO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcclxuICAgIC8vIEdldCBzaGVldCBjb3VudFxyXG4gICAgZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3MoaW5mbykge1xyXG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xyXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbykge1xyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IG5ldyBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgaW5mby50aXRsZSk7XHJcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gaW5mby5zaGVldENvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2FkZWRTaGVldENvdW50ID09IGluZm8uc2hlZXRDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xyXG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXQuc2hlZXRzW3Jlc3BvbnNlLmZlZWQudGl0bGUuJHRdID0gbmV3IFNoZWV0KCk7XHJcblxyXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZS5ncyRjZWxsLnJvdyAtIDE7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0gbmV3IFJvdyhpbmRleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XS5yb3dDZWxscy5wdXNoKG5ldyBSb3dDZWxsKGUuZ3MkY2VsbC5jb2wgLSAxLCBlLmNvbnRlbnQuJHQpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTb3J0IHJvdyBjZWxscyBieSBjb2wgaW5kZXhcclxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgcm93LnJvd0NlbGxzLnNvcnQoZnVuY3Rpb24oYzEsIGMyKSB7IHJldHVybiBjMS5jb2xJbmRleCAtIGMyLmNvbEluZGV4OyB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xyXG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0Q291bnQ6IHJlc3BvbnNlLmZlZWQuZW50cnkubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiByZXNwb25zZS5mZWVkLnRpdGxlLiR0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgb25TdWNjZXNzKGluZm8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCB0aXRsZSkge1xyXG4gICAgdGhpcy5rZXkgPSBzcHJlYWRzaGVldEtleTtcclxuICAgIHRoaXMudGl0bGUgPSB0aXRsZTtcclxuICAgIHRoaXMuc2hlZXRzID0gbmV3IFNoZWV0cygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTaGVldHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gU2hlZXQoKSB7XHJcbiAgICB0aGlzLnJvd3MgPSBbXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5TaGVldC5wcm90b3R5cGUuaGVhZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dzWzBdLnZhbHVlcygpO1xyXG59XHJcblxyXG5TaGVldC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihyb3csIGNvbE5hbWUpIHtcclxuICAgIHZhciBjb2xJbmRleCA9IHRoaXMuaGVhZGVyKCkuaW5kZXhPZihjb2xOYW1lKTtcclxuICAgIGlmIChjb2xJbmRleCA9PSAtMSlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICQuZWFjaChyb3cucm93Q2VsbHMsIGZ1bmN0aW9uKGksIHJvd0NlbGwpIHtcclxuICAgICAgICBpZiAocm93Q2VsbC5jb2xJbmRleCA9PSBjb2xJbmRleCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSByb3dDZWxsLnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gUm93KHJvd0luZGV4KSB7XHJcbiAgICB0aGlzLnJvd0luZGV4ID0gcm93SW5kZXg7XHJcbiAgICB0aGlzLnJvd0NlbGxzID0gW107XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcblJvdy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gJC5tYXAodGhpcy5yb3dDZWxscywgZnVuY3Rpb24ocm93Q2VsbCwgaSkge1xyXG4gICAgICAgIHJldHVybiByb3dDZWxsLnZhbHVlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJvd0NlbGwoY29sSW5kZXgsIHZhbHVlKSB7XHJcbiAgICB0aGlzLmNvbEluZGV4ID0gY29sSW5kZXg7XHJcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxufSJdfQ==
