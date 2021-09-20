$(document).ready(() => {

  var StyleArray= [], lineStyleArray=[], ColorArray= [], activeGraphElements=[], HistoryArray = [], GraphFetchLoop = false;

  var activeLayoutType ="circle";
  //Data Retrieval Functions

  //Fetches ALL styles
  function fetchStyles(){
    return new Promise((resolve, reject) => {    
    $.ajax({url: "http://localhost:5005/graphql",
      contentType: "application/json",type:'POST',
      data: JSON.stringify({ query:`{   stylings{
        name
        id
        nodeColor
        lineColor
        lineHeight
        lineDash
        lineGap
        }
      }`
    }),
    success: function(result) {
      StyleArray=[
        {selector: "node",
          style: {
            label: "data(id)"
          }
        },
        { selector: "edge",
          style: {
            "font-size":"0em",
            "curve-style":"bezier",
            "target-arrow-shape": "triangle",
            label:""
          }
        },
        { selector: "[stylingId='node_active']",
          style: {
            "background-color":"blue",
          }
        }, 
        { selector: "[stylingId='node_inactive']",
          style: {
            "background-color":"red",
          }
        }
      ];
      result.data.stylings.forEach(element => {     
        let toOutput = {
          selector: "[stylingId='"+ element.id+"']",
          name:element.name,
          style: {}       
        }
        Object.keys(element).forEach(styleElement =>{
          if(styleElement !== "id"){
              if(styleElement === "nodeColor"){
                toOutput.style["background-color"] = element[styleElement];
              } else if(styleElement === "lineColor"){
                toOutput.style["line-color"] = element[styleElement];
                toOutput.style["target-arrow-color"] = element[styleElement];
              } else if(styleElement === "lineDash" || styleElement === "lineGap" ){
                toOutput.style["line-style"] = "dashed";
                toOutput.style["line-dash-pattern "] = element["lineDash"]+ "," + element["lineGap"];                
              } else if(styleElement === "lineHeight"){
               // toOutput.style["width"] = element[styleElement];
              }else{
                toOutput.style[styleElement] = element[styleElement];
              }
          }
        })

        toOutput.style["background-color"] = element.nodeColor;        
        StyleArray.push(toOutput);
      })

      cy.style(StyleArray);
    
      displayLegend();
      resolve(1);
    },
    error: function(){
      resolve(-1);
    }})
  })};

  //Gets a list of al Missions
  function fetchDatasetIndices(){
   return new Promise((resolve, reject) => {   
    $.ajax({url: "http://localhost:5005/graphql",
        contentType: "application/json",type:'POST',
        data: JSON.stringify({ 
          query:`{  allGraphs{
            id
            }
          }`
      }),
      success: function(result) {
        let options= "<option selected='selected' disabled=true>--Select A Mission--</option>";
        if(result.errors || result.data === undefined || result.data.allGraphs === null ){
          document.getElementById("MissionWarningSpan").innerHTML = "  Failed to Fetch Missions- Ensure Data Flow is intact, then Fetch Missions";
          resolve("Failed to Fetch Missions");
        } else {            
          result.data.allGraphs.forEach(element=>{
            options += "<option>"+element.id+"</option>";
          })
          document.getElementById("graphSelect").innerHTML = options;
          document.getElementById("MissionWarningSpan").innerHTML = "";
          resolve(1);
        }
      },
      error: function(){
        document.getElementById("MissionWarningSpan").innerHTML = "  Failed to Fetch Missions- Ensure Data Flow is intact, then Fetch Missions";;
        resolve("Failed to Fetch Missions");
      }
    })
   })
  }  

  //Gets the graph data from a specific mission - only enough to draw the node-and-edge chart
  function fetchSpecificGraph(incId){
    return new Promise((resolve, reject) => {    
    $.ajax({url: "http://localhost:5005/graphql",
      contentType: "application/json",type:'POST',
      data: JSON.stringify({ query:
      `{   nodeGraph(id:`+ incId+` ){
          id
          name
          type
          startNode
          nodes{
            id
            stylingId
          }
          edges{
            id
            stylingId
            source
            target
          }
        }
      }`
    }),
    success: function(result) {
      let outElements = [];
      if(result.data.nodeGraph.nodes === null|| result.data.nodeGraph.nodes === undefined){
        document.getElementById("MissionWarningSpan").innerHTML = " Mission #" + document.getElementById("graphSelect").value + " failed to retrieve. Please verify the integrity of the data, or select a different Mission";
        resolve("Empty or Undefined graph");
      } else {
        result.data.nodeGraph.nodes.forEach(node=>{
          node.referenceid = node.id;
          node.id = "node_"+node.id.split("-")[0];
          node.type="node";
          outElements.push({data:node})
        });
        if(result.data.nodeGraph.edges){
          result.data.nodeGraph.edges.forEach(edge=>{
            if(edge.source && edge.source !== null && edge.target && edge.target!= null){
              edge.type="edge";
              edge.referenceid = edge.id;
              edge.id = "edge_"+edge.id.split("-")[0];
              edge.source = "node_" +edge.source;
              edge.target = "node_" + edge.target;
              outElements.push({data:edge})
            }
          });
        }
        activeGraphElements = outElements;
        document.getElementById("MissionWarningSpan").innerHTML = "";
        cy.resize();
        loadElements();
        resolve(1);
     }
    },
    error: function(){
      document.getElementById("MissionWarningSpan").innerHTML = " Mission #" + document.getElementById("graphSelect").value + " failed to retrieve. Please verify the integrity of the data, or select a different Mission";
      resolve("Empty or Undefined graph");
    }})
  })};

  function fetchSpecificGraphWithSave(incId){
    return new Promise((resolve, reject) => {    
    $.ajax({url: "http://localhost:5005/graphql",
      contentType: "application/json",type:'POST',
      data: JSON.stringify({ query:
      `{   nodeGraph(id:`+ incId+` ){
          id
          name
          type
          startNode
          nodes{
            id
            stylingId
          }
          edges{
            id
            stylingId
            source
            target
          }
        }
      }`
    }),
    success: function(result) {
      SaveLayout();
      let outElements = [];
      if(result.data.nodeGraph.nodes === null|| result.data.nodeGraph.nodes === undefined){
        document.getElementById("MissionWarningSpan").innerHTML = " Mission #" + document.getElementById("graphSelect").value + " failed to retrieve. Please verify the integrity of the data, or select a different Mission";
        resolve("Empty or Undefined graph");
      } else {
        result.data.nodeGraph.nodes.forEach(node=>{
          node.referenceid = node.id;
          node.id = "node_"+node.id.split("-")[0];
          node.type="node";
          outElements.push({data:node})
        });
        if(result.data.nodeGraph.edges){
          result.data.nodeGraph.edges.forEach(edge=>{
            if(edge.source && edge.source !== null && edge.target && edge.target!= null){
              edge.type="edge";
              edge.referenceid = edge.id;
              edge.id = "edge_"+edge.id.split("-")[0];
              edge.source = "node_" +edge.source;
              edge.target = "node_" + edge.target;
              outElements.push({data:edge})
            }
          });
        }
        activeGraphElements = outElements;
        document.getElementById("MissionWarningSpan").innerHTML = "";
        cy.resize();
        loadElements();
        resolve(1);
     }
    },
    error: function(){
      document.getElementById("MissionWarningSpan").innerHTML = " Mission #" + document.getElementById("graphSelect").value + " failed to retrieve. Please verify the integrity of the data, or select a different Mission";
      resolve("Empty or Undefined graph");
    }})
  })};

  //Gets the data (including data not used directly in the graph)
  function fetchSpecificDatum(incData){
    if(incData.type !== undefined){
      let missionID = document.getElementById("graphSelect").value;
      let elementID= incData.referenceid;
      document.getElementById("detailContent").innerHTML = "Loading...";
      
      if(incData.type === "edge"){
        $.ajax({url: "http://localhost:5005/graphql",
          contentType: "application/json", type:'POST',
          data: JSON.stringify({ query:`{   
            nodeGraph(id:`+ missionID+` ){         
              edge(edgeId:"` + elementID+`"){
                id
                stylingId
                source
                target
                data{
                  id
                  name
                  value
                }
              }
            }
          }`
          }),
          success: function(result){
            DisplaySelectedDetailData(incData, result.data.nodeGraph.edge.data);
          },
          error: function(){
            console.log("error on data retrieval")
          }
        })
      }else{
        $.ajax({url: "http://localhost:5005/graphql",
          contentType: "application/json", type:'POST',
          data: JSON.stringify({ query:`{   
            nodeGraph(id:`+ +missionID+` ){         
              node(nodeId:`+ '\"' + elementID + '\"' + `){
                stylingId
                data{
                  id
                  name
                  value
                }
              }
            }
          }`
          }),
          success: function(result){
            DisplaySelectedDetailData(incData, result.data.nodeGraph.node.data);
          }, error: function(){
            console.log("error on data retrieval")
          }
        })
      }
    }
  }

  var cy = cytoscape({

    container:document.getElementById("NEContent"),

    elements:[
      ],
    layout:{
        name:"preset"
    },
    style:[
    ]
  })

  //Code that runs at start
  fetchStyles();
  fetchDatasetIndices();
  DataFetchLoop();

  function DataFetchLoop(){
    let GraphId= document.getElementById("graphSelect").value;
    if(GraphId ==="--Select A Mission--"|| GraphId === undefined || GraphId ===""){
      GraphFetchLoop = false;
    }else{
      GraphFetchLoop = true;
    }

    if(GraphFetchLoop === true){     
      fetchSpecificGraphWithSave(GraphId).then(()=>{
        console.log("Fetching Graph #" + GraphId);
        setTimeout(() => {
          DataFetchLoop();
        }, 1000);
      })
    } else{
      console.log("waiting 10 seconds to check on selected graph.");
      setTimeout(() => {
        DataFetchLoop();
      }, 10000);
    }
  }

  function loadElements(){
    cy.remove(cy.nodes());
    cy.add(activeGraphElements);
   
    if(activeLayoutType != "preset"){
      var layout = cy.layout({
        name: activeLayoutType
      });
      layout.run();
    } else if (HistoryArray.length > 0){
     PositionNodes();
    } else{ 
      //WATCH: SETS A DEFAULT BEHAIVOR FOR LAYOUTS WHEN THERE IS NO HISTORY AND AN INVALID LAYOUT TYPE SELECTED
      var layout = cy.layout({
        name: "circle"
      });
    }
    if(HistoryArray.length === 0){
      SaveLayout();
    }
  }

  function displayLegend(){
      let LegendList = document.getElementById("legendList")
      LegendList.innerHTML ="";
      let iter =0;
      StyleArray.forEach(element => {
        let color = element.style["background-color"];
        let listItem = document.createElement("li");
        listItem.id = "elementListItem" +iter; listItem.classList.add(iter+1);
        //get name
        if(element.name){
          listItem.innerHTML = element.name;
        }else if(element.style && element.style.name){
          listItem.innerHTML = element.style.name;
        }else{          
          listItem.innerHTML = element.selector;
        }       

        let listExample = document.createElement("span");
        //Squares for node styles, rectangles for line styles.
        if (element.selector.includes("edge")){
          color = element.style["line-color"];
          listExample.innerHTML = "<svg class='floatRight' width='20' height ='20'><rect y=7 width='20' height='7' fill=" + color+ "></rect></svg>";
        }else{ 
          listExample.innerHTML = "<svg class='floatRight' width='20' height ='20'><rect width='20' height='20' fill=" + color+ "></rect></svg>";
        }
        listItem.append(listExample);
        LegendList.append(listItem);
        document.getElementById("elementListItem" +iter).addEventListener("click",function(){
          EnableFiltersSelection();
          document.getElementById("SelectedFilter").selectedIndex = this.classList[0];
          displaySpecificStyle();
        })
        iter++;
      })
    
  } 
  //On change of Layout
  document.getElementById("layoutType").addEventListener("change", function() {
    activeLayoutType = this.value;
    var layout = cy.layout({
      name: activeLayoutType
    });
    layout.run();
  });

  //click toggle Legend Button
  document.getElementById("toggleLegendButton").addEventListener("click",function(e){
      let List = document.getElementById("legendList")
      if(List.classList[0] === "enabled"){ 
        List.classList.remove("enabled");
        List.classList.add("disabled");
      }else{
        List.classList.add("enabled");
        List.classList.remove("disabled");
      }
  });

  //On click run 
  document.getElementById("runLayoutButton").addEventListener("click",function(){
    if(activeLayoutType != "preset"){
      var layout = cy.layout({
        name: activeLayoutType
      });
      layout.run();
    } else {
      PositionNodes();
    }
  })

  //Button hookups and other events
  document.getElementById("saveLayoutButton").addEventListener("click",function(){SaveLayout() })
  document.getElementById("EditFiltersButton").addEventListener("click",function(){EnableFiltersSelection();});
  document.getElementById("graphSelect").addEventListener("change",function(e){fetchSpecificGraph(this.value);})
  document.getElementById("historySelect").addEventListener("change", function(e){PositionNodes()})
  document.getElementById("FetchMissionsButton").addEventListener("click", function(e){fetchDatasetIndices()});
  cy.on("click", function(evt) {fetchSpecificDatum(evt.target.data())});


  function PositionNodes(){
    selectedHistory = HistoryArray[document.getElementById("historySelect").value].data.nodes;
    let existingNodes = activeGraphElements, connections = cy.json().elements.edges, outNodes =[];

    cy.remove(cy.nodes())

    existingNodes.forEach(newNode=>{    
      let comparisonId = newNode.data.id;
      //need to clone, not reference. If imported a library that has better cloning, use it here.
      let temp = selectedHistory.find(x=> x.data.id === comparisonId);
      if(temp){
        let oldNode = JSON.parse(JSON.stringify(temp));
        newNode.position = oldNode.position;
        outNodes.push(newNode)
      }else{
        connections.push(newNode);
      }
    })
    cy.add(outNodes);
    cy.add(connections);
    SaveLayout();
  }

  function SaveLayout(){
    nodes= [], oldEles = cy.nodes();

    let historyElement = document.getElementById("historySelect")
    cy.nodes().forEach(element=> {
      nodes.push(element.data());
    })

    let LayoutName ="";
    if(document.getElementById("NametoSaveAs").value !== undefined && document.getElementById("NametoSaveAs").value !== ""){
      LayoutName = document.getElementById("NametoSaveAs").value;
    }else{
      LayoutName = "Layout ";
      if(HistoryArray.length !== 0 && HistoryArray.length !== undefined){
        LayoutName += (HistoryArray.length+1) + ": ";
      }else{
        LayoutName += " 1: ";
      }
      LayoutName += document.getElementById("layoutType").value +" base";
    }
    
    let overwriteIndex = HistoryArray.findIndex( x=> x.title === LayoutName);
    if(overwriteIndex === -1){
      HistoryArray.push({title:LayoutName, data:cy.json().elements});
      let output = historyElement.innerHTML;
      output += "<option value = "+ (HistoryArray.length -1)+">" + LayoutName+ " </option>"
      historyElement.innerHTML = output;
      historyElement.value = (HistoryArray.length -1);

    }else{
      HistoryArray[overwriteIndex].data = cy.json().elements;
    }
  }

  //displays information in the detail page
  function DisplaySelectedDetailData(incData, incElementData) {
    let ElementData = incElementData;
    if (incData.source) {
      // Edge
      document.getElementById("detailHeader").innerHTML = "Edge: " + incData.id;
      let detailContent = 
      "<h4>Graphical Status</h4>Source: " + incData.source +
      "<br> Destination: " +  incData.target +
      "<br> StylingId: " + incData.stylingId +
      "<br><h4>Internal Data: </h4> ";
      Object.keys(ElementData).forEach(dataType =>{
        detailContent += ElementData[dataType].name + ": "+ ElementData[dataType].value + "<br>";
      })
      document.getElementById("detailContent").innerHTML = detailContent;
    } else if (incData.id) {
      //node
      document.getElementById("detailHeader").innerHTML = "Node: " + incData.id;
      let detailContent = 
      "<h3>Graphical Status</h3><br> StylingId: " + incData.stylingId +
      "<br><h3>Internal Data: </h3> ";
      Object.keys(ElementData).forEach(dataType =>{
        detailContent += ElementData[dataType].name+ ": "+ ElementData[dataType].value + "<br>";
      })
    document.getElementById("detailContent").innerHTML = detailContent;
    }
  }
  
  function EnableFiltersSelection(){
     document.getElementById("detailHeader").innerHTML ="Editing Filters";

    let selection= `<select id="SelectedFilter">
    <option disabled selected value> -- select a filter -- </option>`;
    StyleArray.forEach(element => {
      selection += "<option>" + element.selector + "</option>"
    })
    selection += "</select> <hr> ";
    document.getElementById("detailContent").innerHTML = selection;

    let filterContent = document.createElement("div");
    filterContent.id = "FilterContent"; filterContent.innerHTML = "Select a Filter to See or Edit its Details";
    document.getElementById("detailContent").append(filterContent);
    document.getElementById("SelectedFilter").addEventListener("change", displaySpecificStyle);
  }

  //Function that sets the detail section to the edit filter section
  //when a user selects a "filter" to edit this displays the relevant data.
  function displaySpecificStyle(){

    let Selector = document.getElementById("SelectedFilter");
    let toOutput = "Selector: <input id='SelectorInput' type=text value="+ Selector.value +"><hr> ",
    relevantStyle = StyleArray.find(element => element.selector === Selector.value),
    keys = Object.keys(relevantStyle.style), iter= 0;

    keys.forEach(key=> {
      toOutput += "<input id='key"+ iter+"' type=text value="+ key +">:<input id='value"+
      iter+"' type=text value="+ relevantStyle.style[key] +"><hr> ";
      iter++;  
    })

    toOutput+="<button id='addFilterPairButton'>+</button><br><button id='submitStyleChangeButton' data_fields="+iter +">Save Changes</button>"

    document.getElementById("FilterContent").innerHTML = toOutput;
    let indexofStyle = StyleArray.indexOf(relevantStyle)
    document.getElementById("submitStyleChangeButton").addEventListener("click", function(e){
      setSpecificStyle(e.target, indexofStyle );
    })

    //add a new blank pair of elements to the list.
    document.getElementById("addFilterPairButton").addEventListener("click", function(e){
      let iter = document.getElementById("submitStyleChangeButton").getAttribute("data_fields");
      let parentElement=document.getElementById("FilterContent");
      let referencePoint = parentElement.children[parentElement.children.length -3]
      let firstNode = document.createElement("input"); firstNode.id ="key" + iter; firstNode.type="text";
      let textNode = document.createTextNode(":");
      let secondNode = document.createElement("input"); secondNode.id ="value" + iter; secondNode.type="text";
      parentElement.insertBefore(firstNode, referencePoint);
      parentElement.insertBefore(textNode, referencePoint);
      parentElement.insertBefore(secondNode, referencePoint);
      parentElement.insertBefore(document.createElement("hr"), referencePoint);
      document.getElementById("submitStyleChangeButton").setAttribute("data_fields" , parseInt(iter)+1);
    })
  }

  //sends updated information up to the cytoscape component and replaced old stylesheet with a new one.
  function setSpecificStyle(incTarget, styleIndex){   
    let newStyle = {selector:document.getElementById("SelectorInput").value, style:{}}
    
    for(let i=0; i< incTarget.getAttribute("data_fields"); i++){
      let key = document.getElementById("key"+i).value, value =document.getElementById("value"+i).value;
      if(key && value && key.trim() !== "" && value.trim() !== ""){//prevent empty attributes from passing through.
        newStyle.style[key] = value;
      }
    }     
    StyleArray.splice(styleIndex, 1, newStyle);
    cy.style(StyleArray);

    //update Legend
    displayLegend();
  }

})