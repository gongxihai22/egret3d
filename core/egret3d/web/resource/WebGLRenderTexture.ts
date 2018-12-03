namespace egret3d.web {
    /**
     * @internal
     */
    export interface IWebGLRenderTexture {
        frameBuffer: WebGLFramebuffer | null;
        renderBuffer: WebGLRenderbuffer | null;
    }
    /**
     * @internal
     */
    export class WebGLRenderTexture extends RenderTexture implements IWebGLTexture, IWebGLRenderTexture {
        public webglTexture: GlobalWeblGLTexture | null = null;
        public frameBuffer: WebGLFramebuffer | null = null;
        public renderBuffer: WebGLRenderbuffer | null = null;
        private _setupFrameBufferTexture(frameBuffer: WebGLFramebuffer, texture: GlobalWeblGLTexture, textureTarget: number, type: gltf.TextureDataType, width: number, height: number, format: gltf.TextureFormat, attachment: number): void {
            const webgl = WebGLCapabilities.webgl!;

            webgl.texImage2D(textureTarget, 0, format, width, height, 0, format, type, null);
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, frameBuffer);
            webgl.framebufferTexture2D(webgl.FRAMEBUFFER, attachment, textureTarget, texture, 0);
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);
        }
        private _setupRenderBufferStorage(frameBuffer: WebGLFramebuffer, renderBuffer: WebGLRenderbuffer, depthBuffer: boolean, stencilBuffer: boolean, width: number, height: number): void {
            const webgl = WebGLCapabilities.webgl!;
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, frameBuffer);
            //
            webgl.bindRenderbuffer(webgl.RENDERBUFFER, renderBuffer);
            if (depthBuffer && stencilBuffer) {
                webgl.renderbufferStorage(webgl.RENDERBUFFER, webgl.DEPTH_STENCIL, width, height);
                webgl.framebufferRenderbuffer(webgl.FRAMEBUFFER, webgl.DEPTH_STENCIL_ATTACHMENT, webgl.RENDERBUFFER, renderBuffer);
            }
            else if (depthBuffer) {
                webgl.renderbufferStorage(webgl.RENDERBUFFER, webgl.DEPTH_COMPONENT16, width, height);
                webgl.framebufferRenderbuffer(webgl.FRAMEBUFFER, webgl.DEPTH_ATTACHMENT, webgl.RENDERBUFFER, renderBuffer);
            }
            else {
                webgl.renderbufferStorage(webgl.RENDERBUFFER, webgl.RGBA4, width, height);
            }

            webgl.bindRenderbuffer(webgl.RENDERBUFFER, null);
            //
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);
        }
        private _setupDepthRenderbuffer(frameBuffer: WebGLFramebuffer, renderBuffer: WebGLRenderbuffer, depthBuffer: boolean, stencilBuffer: boolean, width: number, height: number) {
            const webgl = WebGLCapabilities.webgl!;
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, frameBuffer);
            this._setupRenderBufferStorage(frameBuffer, renderBuffer, depthBuffer, stencilBuffer, width, height);
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);
        }
        private _setupRenderTexture(): void {
            const sampler = this._sampler;
            const paperExtension = this._gltfTexture!.extensions.paper!;
            const width = paperExtension.width!;
            const height = paperExtension.height!;
            const format = paperExtension.format!;
            const depth = paperExtension.depthBuffer!;
            const stencil = paperExtension.stencilBuffer!;
            //
            const webgl = WebGLCapabilities.webgl!;
            if (!this.frameBuffer) {
                this.frameBuffer = webgl.createFramebuffer()!;
            }
            if (!this.webglTexture) {
                this.webglTexture = webgl.createTexture()!;
            }
            webgl.bindTexture(webgl.TEXTURE_2D, this.webglTexture);
            const isPowerOfTwo = WebGLUtility.isPowerOfTwo(width, height);
            WebGLUtility.setTexturexParameters(isPowerOfTwo, sampler);
            this._setupFrameBufferTexture(this.frameBuffer, this.webglTexture, webgl.TEXTURE_2D, gltf.TextureDataType.UNSIGNED_BYTE, width, height, format, webgl.COLOR_ATTACHMENT0);

            const minFilter = sampler.minFilter!;
            const canGenerateMipmap = isPowerOfTwo && minFilter !== gltf.TextureFilter.NEAREST && minFilter !== gltf.TextureFilter.LINEAR;
            if (canGenerateMipmap) {
                webgl.generateMipmap(webgl.TEXTURE_2D);
            }

            webgl.bindTexture(webgl.TEXTURE_2D, null);

            if (depth || stencil) {
                if (!this.renderBuffer) {
                    this.renderBuffer = webgl.createRenderbuffer()!;
                }
                this._setupDepthRenderbuffer(this.frameBuffer, this.renderBuffer, depth, stencil, width, height);
            }
        }

        public activateRenderTexture() {
            if (this._dirty) {
                this._setupRenderTexture();
                this._dirty = false;
            }
            const webgl = WebGLCapabilities.webgl!;
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, this.frameBuffer);
        }

        public generateMipmap(): boolean {
            if (this._mipmap) {
                const webgl = WebGLCapabilities.webgl!;
                webgl.bindTexture(webgl.TEXTURE_2D, this.webglTexture);
                webgl.generateMipmap(webgl.TEXTURE_2D);
                webgl.bindTexture(webgl.TEXTURE_2D, null);
                return true;
            }
            return false;
        }

        public dispose() {
            if (!super.dispose()) {
                return false;
            }
            const webgl = WebGLCapabilities.webgl!;
            if (!this.webglTexture) {
                webgl.deleteBuffer(this.webglTexture);
            }
            if (!this.frameBuffer) {
                webgl.deleteFramebuffer(this.frameBuffer);
            }
            if (!this.renderBuffer) {
                webgl.deleteRenderbuffer(this.renderBuffer);
            }
            //
            this.webglTexture = null;
            this.frameBuffer = null;
            this.renderBuffer = null;
            return true;
        }
    }
    // Retargetting.
    egret3d.RenderTexture = WebGLRenderTexture;
}