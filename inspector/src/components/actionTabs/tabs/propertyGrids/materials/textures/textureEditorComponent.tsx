import * as React from 'react';
import { GlobalState } from '../../../../../globalState';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { TextureCanvasManager } from './textureCanvasManager';
import { TextureChannelToDisplay } from '../../../../../../textureHelper';
import { Tool, Toolbar } from './toolbar';
import { Tools } from "babylonjs/Misc/tools";

require('./textureEditor.scss');

interface TextureEditorComponentProps {
    globalState: GlobalState;
    texture: BaseTexture;
}

interface TextureEditorComponentState {
    channel: TextureChannelToDisplay;
}

declare global {
    var _TOOL_DATA_ : any;
}

export class TextureEditorComponent extends React.Component<TextureEditorComponentProps, TextureEditorComponentState> {
    private _textureCanvasManager: TextureCanvasManager;
    private canvasUI = React.createRef<HTMLCanvasElement>();
    private canvas2D = React.createRef<HTMLCanvasElement>();
    private canvasDisplay = React.createRef<HTMLCanvasElement>();

    private channels = [
        {name: "RGBA", channel: TextureChannelToDisplay.All, className: "all"},
        {name: "R", channel: TextureChannelToDisplay.R, className: "red"},
        {name: "G", channel: TextureChannelToDisplay.G, className: "green"},
        {name: "B", channel: TextureChannelToDisplay.B, className: "blue"},
        {name: "A", channel: TextureChannelToDisplay.A, className: "alpha"},
    ]

    constructor(props : TextureEditorComponentProps) {
        super(props);
        this.state = {
            channel: TextureChannelToDisplay.All,
        }
    }

    componentDidMount() {
        this._textureCanvasManager = new TextureCanvasManager(
            this.props.texture,
            this.canvasUI.current!,
            this.canvas2D.current!,
            this.canvasDisplay.current!
        );
    }

    componentDidUpdate() {
        this._textureCanvasManager.displayChannel = this.state.channel;
    }

    componentWillUnmount() {
        this._textureCanvasManager.dispose();
    }

    loadTool(url : string) {
        Tools.LoadScript(url,
            () => {
                const tool : Tool = {
                    ..._TOOL_DATA_,
                    instance: new _TOOL_DATA_.type({
                        scene: this._textureCanvasManager.scene,
                        canvas2D: this._textureCanvasManager.canvas2D,
                        size: this._textureCanvasManager.size,
                        updateTexture: () => this._textureCanvasManager.updateTexture(),
                        getMetadata: () => this.state.metadata,
                        setMetadata: (data : any) => this.setMetadata(data)
                    })
                };
                const newTools = this.state.tools.concat(tool);
                this.setState({tools: newTools});
                console.log(tool);
            });
    }

    changeTool(index : number) {
        if (index != -1) {
            this._textureCanvasManager.tool = this.state.tools[index];
        } else {
            this._textureCanvasManager.tool = null;
        }
        this.setState({activeToolIndex: index});
    }

    setMetadata(newMetadata : any) {
        const data = {
            ...this.state.metadata,
            ...newMetadata
        }
        this.setState({metadata: data});
    }

    render() {
        return <div id="texture-editor">
            <div id="controls">
                <div id="channels">
                    {this.channels.map(
                        item => {
                            const classNames = (item.channel === this.state.channel) ? "selected command " + item.className : "command " + item.className;
                            return <button className={classNames} key={item.name} onClick={() => this.setState({channel: item.channel})}>{item.name}</button>
                        }
                    )}
                </div>
            </div>
            <div id="editing-area">
                <canvas id="canvas-ui" ref={this.canvasUI} tabIndex={1}></canvas>
            </div>
            <canvas id="canvas-display" ref={this.canvasDisplay} width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true}></canvas>
            <canvas id="canvas-2D" ref={this.canvas2D} width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true}></canvas>
        </div>
    }
}