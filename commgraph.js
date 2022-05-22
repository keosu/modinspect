import { tensorflow } from "./protos/tf-proto.js";
import { xmodel } from "./protos/xmodel-proto.js";
import { onnx } from "./protos/onnx-proto.js";
import { protobuf } from "./protos/protobuf.js"
import { fstat, openSync, readFileSync, writeFileSync } from "fs";


export class CommGraph {
    constructor() {
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
    from_onnx(onnx_file) {
        const buf = readFileSync(openSync(onnx_file));
        const reader = protobuf.BinaryReader.open(buf);
        const m = onnx.ModelProto.decode(reader);
        const tensors = new Map();
        m.graph.node.forEach(x => {
            x.input.forEach(inname => {
                if (!tensors.has(inname)) {
                    tensors.set(inname, { 'inputs': [], 'outputs': [] });
                }
                tensors.get(inname)['outputs'].push(x.name);
            });
            x.output.forEach(inname => {
                if (!tensors.has(inname)) {
                    tensors.set(inname, { 'inputs': [], 'outputs': [] });
                }
                tensors.get(inname)['inputs'].push(x.name);
            });

        });
        m.graph.node.forEach(x => {
            let node = new CommNode(x.name);
            node.optype = x.op_type;
            node.inputs = new Set();
            for (let i = 0; i < x.input.length; i++) {
                for (let j = 0; j < tensors.get(x.input[i])['inputs'].length; j++) {
                    node.inputs.add(tensors.get(x.input[i])['inputs'][j]);
                }
            }
            node.outputs = new Set();
            for (let i = 0; i < x.output.length; i++) {
                for (let j = 0; j < tensors.get(x.output[i])['outputs'].length; j++) {
                    node.outputs.add(tensors.get(x.output[i])['outputs'][j]);
                }
            }
            this.nodes.set(x.name, node);
        });


    }
    _parse_tf_graphdef(gdef) {
        gdef.node.forEach(x => {
            let name = x.name;
            if (!this.nodes.has(name)) {
                let node = new CommNode(name);
                this.nodes.set(name, node);
            }

            this.nodes.get(name).optype = x.op;

            for (let j = 0; j < x.input.length; j++) {
                let inname = x.input[j];
                if (!this.nodes.has(inname)) {
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
            if (!this.nodes.has(name)) {
                let node = new CommNode(name);
                this.nodes.set(name, node);
            }

            this.nodes.get(name).optype = x.op_type;

            for (let j = 0; j < x.args.length; j++) {
                let inname = x.args[j].arg_ops[0];
                if (!this.nodes.has(inname)) {
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
        this.nodes.forEach((N, name) => {
            if (opcounter.has(N.optype)) {
                opcounter.set(N.optype, opcounter.get(N.optype) + 1);
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

    save_to_dot(file_name) {
        let dot = 'digraph G { \n';
        this.nodes.forEach((N, name) => {
            if (N.inputs.size > 0) {
                dot += '"' + name + '" [label="' + N.optype + '"]\n';
                N.inputs.forEach((inname) => {
                    dot += '"' + inname + '" -> "' + name + '"\n';
                });
            } else if (N.optype != 'Const') {
                dot += '"' + name + '" [label="' + N.optype + '"]\n';
            }
        });
        dot += '}\n'

        writeFileSync(file_name, dot);

    }

};

class CommNode {
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

