import * as React from "react";
import { GlobalState } from '../globalState';

import { Engine } from 'babylonjs/Engines/engine';
import { SceneLoader } from 'babylonjs/Loading/sceneLoader';
import { GLTFFileLoader } from "babylonjs-loaders/glTF/index";
import { Scene } from 'babylonjs/scene';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { ArcRotateCamera } from 'babylonjs/Cameras/arcRotateCamera';
import { FramingBehavior } from 'babylonjs/Behaviors/Cameras/framingBehavior';
import { EnvironmentTools } from '../tools/environmentTools';
import { Tools } from 'babylonjs/Misc/tools';

require("./renderingZone.scss");

interface IRenderingZoneProps {
    globalState: GlobalState;
    assetUrl?: string;
    cameraPosition?: Vector3;
}

export class RenderingZone extends React.Component<IRenderingZoneProps> {
    private _currentPluginName: string;
    private _engine: Engine;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;

    public constructor(props: IRenderingZoneProps) {
        super(props);
    }

    initEngine() {
        this._canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this._engine = new Engine(this._canvas, true, { premultipliedAlpha: false, preserveDrawingBuffer: true });
   
        this._engine.loadingUIBackgroundColor = "#2A2342";

        // Resize
        window.addEventListener("resize", () => {
            this._engine.resize();
        });

        this.loadAsset();
    }

    prepareCamera() {
        let camera: ArcRotateCamera;

        // Attach camera to canvas inputs
        if (!this._scene.activeCamera || this._scene.lights.length === 0) {
            this._scene.createDefaultCamera(true);

            camera = this._scene.activeCamera! as ArcRotateCamera;

            if (this.props.cameraPosition) {
                camera.setPosition(this.props.cameraPosition);
            }
            else {
                if (this._currentPluginName === "gltf") {
                    // glTF assets use a +Z forward convention while the default camera faces +Z. Rotate the camera to look at the front of the asset.
                    camera.alpha += Math.PI;
                }

                // Enable camera's behaviors
                camera.useFramingBehavior = true;

                var framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior;
                framingBehavior.framingTime = 0;
                framingBehavior.elevationReturnTime = -1;

                if (this._scene.meshes.length) {
                   camera.lowerRadiusLimit = null;

                    var worldExtends = this._scene.getWorldExtends(function (mesh) {
                        return mesh.isVisible && mesh.isEnabled();
                    });
                    framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
                }
            }

            camera.pinchPrecision = 200 / camera.radius;
            camera.upperRadiusLimit = 5 * camera.radius;

            camera.wheelDeltaPercentage = 0.01;
            camera.pinchDeltaPercentage = 0.01;
        }

        this._scene.activeCamera!.attachControl(this._canvas);     
    }

    handleErrors() {
        let debugLayerEnabled = false;

        // In case of error during loading, meshes will be empty and clearColor is set to red
        if (this._scene.meshes.length === 0 && this._scene.clearColor.r === 1 && this._scene.clearColor.g === 0 && this._scene.clearColor.b === 0) {
            this._canvas.style.opacity = "0";
            debugLayerEnabled = true;
        }
        else {
            if (Tools.errorsCount > 0) {
                debugLayerEnabled = true;
            }
        //    this._canvas.style.opacity = "1";
            let camera = this._scene.activeCamera! as ArcRotateCamera;
            if (camera.keysUp) {
                camera.keysUp.push(90); // Z
                camera.keysUp.push(87); // W
                camera.keysDown.push(83); // S
                camera.keysLeft.push(65); // A
                camera.keysLeft.push(81); // Q
                camera.keysRight.push(69); // E
                camera.keysRight.push(68); // D
            }
        }

        if (debugLayerEnabled) {
            this.props.globalState.onError.notifyObservers(this._scene);
        }        
    }

    prepareLighting() {
        if (this._currentPluginName === "gltf") {
            if (!this._scene.environmentTexture) {
                this._scene.environmentTexture = EnvironmentTools.LoadSkyboxPathTexture(this._scene);
            }

            this._scene.createDefaultSkybox(this._scene.environmentTexture, true, (this._scene.activeCamera!.maxZ - this._scene.activeCamera!.minZ) / 2, 0.3, false);
        }
        else {
            var pbrPresent = false;
            for (var i = 0; i < this._scene.materials.length; i++) {
                if (this._scene.materials[i].transparencyMode !== undefined) {
                    pbrPresent = true;
                    break;
                }
            }

            if (pbrPresent) {
                if (!this._scene.environmentTexture) {
                    this._scene.environmentTexture = EnvironmentTools.LoadSkyboxPathTexture(this._scene);
                }
            }
            else {
                this._scene.createDefaultLight();
            }
        }
    }

    onSceneLoaded(filename: string) {
        this._engine.clearInternalTexturesCache();

        this._scene.skipFrustumClipping = true;

        this.props.globalState.onSceneLoaded.notifyObservers({scene: this._scene, filename: filename});

        this.prepareCamera();
        this.prepareLighting();
        this.handleErrors();
    }

    loadAssetFromUrl() {
        let assetUrl = this.props.assetUrl!;
        let rootUrl = BABYLON.Tools.GetFolderPath(assetUrl);
        let fileName = BABYLON.Tools.GetFilename(assetUrl);
        SceneLoader.LoadAsync(rootUrl, fileName, this._engine).then((scene) => {
            if (this._scene) {
                this._scene.dispose();
            }

            this._scene = scene;

            this.onSceneLoaded(fileName);

            scene.whenReadyAsync().then(() => {
                this._engine.runRenderLoop(() => {
                    scene.render();
                });
            });
        }).catch(function(reason) {
            //TODO sceneError({ name: fileName }, null, reason.message || reason);
        });
    }

    loadAsset() {
        if (this.props.assetUrl) {
            this.loadAssetFromUrl();
            return;
        }
    }

    componentDidMount() {
        if (!Engine.isSupported()) {
            return;
        }

        Engine.ShadersRepository = "/src/Shaders/";

        // This is really important to tell Babylon.js to use decomposeLerp and matrix interpolation
        BABYLON.Animation.AllowMatricesInterpolation = true;
    
        // Setting up some GLTF values
        GLTFFileLoader.IncrementalLoading = false;
        SceneLoader.OnPluginActivatedObservable.add((plugin) =>{
            this._currentPluginName = plugin.name;
            if (this._currentPluginName === "gltf") {
                (plugin as GLTFFileLoader).onValidatedObservable.add((results) =>{
                    if (results.issues.numErrors > 0) {
                        // TODO debugLayerEnabled = true;
                    }
                });
            }
        });

        this.initEngine();
    }

    componentDidUpdate() {

    }

    public render() {
        return (
            <div id="canvasZone">
                <canvas id="renderCanvas" touch-action="none" 
                    onContextMenu={evt => evt.preventDefault()}></canvas>
            </div>
        )
    }
}