import { ToolParameters, ToolData } from '../textureEditorComponent';
import { PointerEventTypes } from 'babylonjs/Events/pointerEvents';

export const Floodfill : ToolData = {
    name: "Floodfill",
    type: class {
        parameters: ToolParameters;
        pointerObservable: any;

        constructor(parameters: ToolParameters) {
            this.parameters = parameters;
        }

        fill() {
            const ctx = this.parameters.canvas2D.getContext('2d')!;
            ctx.fillStyle = this.parameters.getMetadata().color;
            ctx.globalAlpha = this.parameters.getMetadata().opacity;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillRect(0,0, this.parameters.size.width, this.parameters.size.height);
            this.parameters.updateTexture();
        }
        
        setup () {
            this.pointerObservable = this.parameters.scene.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.pickInfo?.hit) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                        this.fill();
                    }
                }
            });
        }
        cleanup () {
            if (this.pointerObservable) {
                this.parameters.scene.onPointerObservable.remove(this.pointerObservable);
            }
        }
    },
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjAsMTAuNWEu
    NzUuNzUsMCwwLDAtMS41LDB2MS4yNWEyLjE0LDIuMTQsMCwwLDAtLjg0LjUzbC02Ljg4LDYuODhhMi4yNSwyLjI1LDAsMCwwLDAsMy4xOGw0Ljg4LDQuODhhMi4yNSwyLjI1LDAsMCwwLDMuMTgsMGw2Ljg4LTYuODhhMi4yNSwyLjI1LDAsMCwwLDAtMy4xOGwtNC44
    OC00Ljg4YTIuMjksMi4yOSwwLDAsMC0uODQtLjUzWm0tOC4xNiw5LjcyLDYuNjYtNi42NlYxNUEuNzUuNzUsMCwwLDAsMjAsMTVWMTMuNTZsNC42Niw0LjY2YS43NS43NSwwLDAsMSwwLDEuMDZsLTEsMUgxMS44Wm0uNDcsMS41M2g5Ljg4bC00LjQxLDQuNDFhLjc1
    Ljc1LDAsMCwxLTEuMDYsMFoiIHN0eWxlPSJmaWxsOiNmZmYiLz48cGF0aCBkPSJNMjcuNTEsMjEuODVhLjg4Ljg4LDAsMCwwLTEuNTQsMGwtMiwzLjc3YTMuMTUsMy4xNSwwLDEsMCw1LjU2LDBabS0yLjIzLDQuNDcsMS40Ni0yLjczLDEuNDUsMi43M2ExLjY1LDEu
    NjUsMCwxLDEtMi45MSwwWiIgc3R5bGU9ImZpbGw6I2ZmZiIvPjwvc3ZnPg==`
};