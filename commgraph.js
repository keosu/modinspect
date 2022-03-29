import { tensorflow} from "./protos/tf-proto.js";
import { xmodel} from "./protos/xmodel-proto.js";
import { protobuf } from "./protos/protobuf.js"
import { openSync, readFileSync } from "fs";


export class CommGraph {
    constructor(){
        this.nodes = new Map();

    }
    from_tf_pb(tfpb_file) {
        const buf = readFileSync(openSync(tfpb_file));
        const reader = protobuf.BinaryReader.open(buf);
        const gdef = tensorflow.GraphDef.decode(reader);
        this._parse_tf_graphdef(gdef);
    }
    from_tf_pbtxt(tfpbtxt_file) {
        const buf = readFileSync(openSync(tfpbtxt_file));
        const reader = protobuf.TextReader.open(buf);
        const gdef = tensorflow.GraphDef.decodeText(reader);
        this._parse_tf_graphdef(gdef);
    }
    from_xmodel(xmodel_file) {
        const buf = readFileSync(openSync(xmodel_file));
        const reader = protobuf.BinaryReader.open(buf);
        const gdef = xmodel.Graph.decode(reader);

        this._parse_xmodel_graphdef(gdef);
    }
    _parse_tf_graphdef(gdef) {
        gdef.node.forEach(x => {
            let name = x.name;
            if(!this.nodes.has(name)) { 
                let node = new CommNode(name);
                this.nodes.set(name, node); 
            }
            
            this.nodes.get(name).optype = x.op; 

            for (let j = 0; j < x.input.length; j++) {
                let inname = x.input[j];
                if(!this.nodes.has(inname)) { 
                    let node = new CommNode(inname);
                    this.nodes.set(inname, node); 
                }
                this.nodes.get(inname).outputs.add(name);
                this.nodes.get(name).inputs.add(inname); 
            }
        });
        

    }

    _parse_xmodel_graphdef(gdef) {
        gdef.op_node.forEach(x => {
            let name = x.op_name;
            if(!this.nodes.has(name)) { 
                let node = new CommNode(name);
                this.nodes.set(name, node); 
            }
            
            this.nodes.get(name).optype = x.op_type; 

            for (let j = 0; j < x.args.length; j++) {
                let inname = x.args[j].arg_ops[0];
                if(!this.nodes.has(inname)) { 
                    let node = new CommNode(inname);
                    this.nodes.set(inname, node); 
                }
                this.nodes.get(inname).outputs.add(name);
                this.nodes.get(name).inputs.add(inname); 
            }
        });
        

    }

    summary() {
        let opcounter = new Map();
        let innodes = new Set();
        let outnodes = new Set();
        this.nodes.forEach((N,name) => {
            if (opcounter.has(N.optype)) {
                opcounter.set(N.optype, opcounter.get(N.optype)+1);
            } else {
                opcounter.set(N.optype, 1);
            }
            if (N.inputs.size == 0 && N.optype != "Const" && N.optype != "const-fix") {
                innodes.add(name)
            }
            if (N.outputs.size == 0) {
                outnodes.add(name)
            }
        });

        console.table(opcounter);
        console.table(innodes);
        console.table(outnodes);
    }
};

class CommNode{
    constructor(name) {
        this.name = name;
        this.optype = "";
        this.inputs = new Set();
        this.outputs = new Set();
    }
};

class CommAttr {
    constructor() {

    }
};

 