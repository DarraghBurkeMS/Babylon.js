import * as React from 'react';
import { SketchPicker } from 'react-color';
import { IToolData } from './textureEditorComponent';

export interface ITool extends IToolData {
    instance: any;
}

interface IToolBarProps {
    tools: ITool[];
    addTool(url: string): void;
    changeTool(toolIndex : number): void;
    activeToolIndex : number;
    metadata: any;
    setMetadata(data : any): void;
}

interface IToolBarState {
    toolURL : string;
    pickerOpen : boolean;
    addOpen : boolean;
}


export class ToolBar extends React.Component<IToolBarProps, IToolBarState> {
    private _addTool = require('./assets/addTool.svg');

    private _pickerRef : React.RefObject<HTMLDivElement>;
    constructor(props : IToolBarProps) {
        super(props);
        this.state = {
            toolURL: "",
            pickerOpen: false,
            addOpen: false
        };
        this._pickerRef = React.createRef();
    }

    computeRGBAColor() {
        const opacityInt = Math.floor(this.props.metadata.opacity * 255);
        const opacityHex = opacityInt.toString(16).padStart(2, '0');
        return `${this.props.metadata.color}${opacityHex}`;
    }

    render() {
        return <div id='toolbar'>
            <div id='tools'>
                {this.props.tools.map(
                    (item, index) => {
                        return <img
                            src={`data:image/svg+xml;base64,${item.icon}`}
                            className={index === this.props.activeToolIndex ? 'icon button active' : 'icon button'}
                            alt={item.name}
                            title={item.name}
                            onClick={evt => {
                                if (evt.button === 0) {
                                    this.props.changeTool(index)
                                }
                            }}
                            key={index}
                        />
                    }
                )}
                <div id='add-tool'>
                    <img src={this._addTool} className='icon button' title='Add Tool' alt='Add Tool' onClick={() => this.setState({addOpen: !this.state.addOpen})}/>
                    { this.state.addOpen && 
                    <div id='add-tool-popup'>
                        <form onSubmit={event => {
                            event.preventDefault();
                            this.props.addTool(this.state.toolURL);
                            this.setState({toolURL: '', addOpen: false})
                        }}>
                            <label>
                                Enter tool URL: <input value={this.state.toolURL} onChange={evt => this.setState({toolURL: evt.target.value})} type='text'/>
                            </label>
                            <button>Add</button>
                        </form>
                    </div> }
                </div>
            </div>
            <div id='color' onClick={() => this.setState({pickerOpen: !this.state.pickerOpen})} title='Color' className={`icon button${this.state.pickerOpen ? ` active` : ``}`}>
                <div id='activeColor' style={{backgroundColor: this.props.metadata.color}}></div>
            </div>
            {
                this.state.pickerOpen &&
                <>
                    <div className='color-picker-cover' onClick={evt => {
                        if (evt.target !== this._pickerRef.current?.ownerDocument.querySelector('.color-picker-cover')) {
                            return;
                        }
                        this.setState({pickerOpen: false});
                    }}>
                    </div>
                    <div className='color-picker' ref={this._pickerRef}>
                            <SketchPicker color={this.computeRGBAColor()}  onChange={color => this.props.setMetadata({color: color.hex, opacity: color.rgb.a})}/>
                    </div>
                </>
            }
        </div>;
    }
}