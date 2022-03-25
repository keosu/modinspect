import { $root } from "./protos/tf-proto.js";
import { protobuf } from "./protos/protobuf.js"
import { openSync, readFileSync } from "fs";
import { exit } from "process";


if (process.argv.length < 3) {
    console.log("input model path");
    exit(-1);
}
var modelname = process.argv[2];

const buf = readFileSync(openSync(modelname));
let gdef = null;
if (modelname.endsWith('pb')) { 
    const reader = protobuf.BinaryReader.open(buf);
    gdef = $root.tensorflow.GraphDef.decode(reader);
} else if (modelname.endsWith('pbtxt')) {
    const reader = protobuf.TextReader.open(buf);
    gdef = $root.tensorflow.GraphDef.decodeText(reader);
}


let name2idx = {};
for (let i = 0; i < gdef.node.length; i++) {
    name2idx[gdef.node[i].name] = i;
}

let nodetype = {};
let info = { 'node': gdef.node.length, 'edge': 0 };
let innodes = new Set(), outnodes = new Set();

gdef.node.forEach(x => {
    if (x.input.length == 0 && x.op != "Const")
        innodes.add(x.name);

    if (nodetype[x.op]) {
        nodetype[x.op]++;
    } else {
        nodetype[x.op] = 1;
    }
    info['edge'] += x.input.length;
    for (let j = 0; j < x.input.length; j++) {
        let src = gdef.node[name2idx[x.input[j]]];
        if (src.output)
            src.output.push(x.name);
        else
            src.output = [x.name];
    }
});

gdef.node.forEach(x => {
    if (!x.output)
        outnodes.add(x.name);
});
console.table(nodetype);
console.table(info);
console.log("input nodes: ", innodes);
innodes.forEach(x => {
    console.table(gdef.node[name2idx[x]].attr.shape.shape.dim);
});
console.log("output nodes: ", outnodes); 