#!/usr/bin/env node

import { exit } from "process";
import { CommGraph } from "./commgraph.js";

if (process.argv.length < 3) {
    console.log("input model path");
    exit(-1);
}
var modelname = process.argv[2];

let g = new CommGraph();

if (modelname.endsWith('pb')) {  
    g.from_tf_pb(modelname);
} else if (modelname.endsWith('pbtxt')) { 
    g.from_tf_pbtxt(modelname);
} else if (modelname.endsWith('xmodel')) { 
    g.from_xmodel(modelname);
} else if (modelname.endsWith('onnx')) {
    g.from_onnx(modelname);
}    

g.summary();   
g.save_to_dot("tmp.dot")