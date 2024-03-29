import { Assets, Sprite, Texture } from "pixi.js";

import lottie, { type AnimationItem } from "lottie-web";

type LottieOptions = {
  /** Lottie动画文件路径 */
  asset: string | Uint8Array;
  /** 是否自动播放 */
  autoplay?: boolean;
  /** 是否循环播放 */
  loop?: boolean;

  width?: number;

  height?: number;

  /** lottie 播放速度 */
  speed?: number;
};

/**
 * LottieSprite
 * @description Lottie动画精灵
 * @example
 * const lottieSprite = new LottieSprite({
 *  asset: "lottie.json",
 * autoplay: true,
 * loop: true,
 * width: 100,
 * height: 100,
 * speed: 1,
 * });
 * app.stage.addChild(lottieSprite);
 * lottieSprite.play();
 * lottieSprite.stop();
 * lottieSprite.destroy();
 */
export class LottieSprite extends Sprite {
  private _lottieAnimation?: AnimationItem;
  private _file?: File | Uint8Array;
  private _canvas?: OffscreenCanvas | HTMLCanvasElement;
  private _playing = false;

  onCompleted?: () => void;
  onProgress?: (progress: number) => void;
  enterFrame?: (currentFrame: number) => void;

  constructor(options: LottieOptions) {
    const width = (options.width ?? 100) * window.devicePixelRatio || 2;
    const height = (options.height ?? 100) * window.devicePixelRatio || 2;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;

    super({ texture: Texture.from(tempCanvas) });

    this._canvas = tempCanvas;

    this.initLottie(options).then(() => {
      this._lottieAnimation?.addEventListener("DOMLoaded", () => {
        if (this._lottieAnimation) {
          this._playing = false;

          this._lottieAnimation.addEventListener("enterFrame", () => {
            this.texture.source.update();
          });
        }
      });
      this.initEvent();
    });
  }

  private async initLottie(options: LottieOptions) {
    this._file =
      typeof options.asset === "string"
        ? await Assets.load(options.asset)
        : options.asset;

    this.width = options.width ?? 100;
    this.height = options.height ?? 100;

    // 初始化Lottie动画
    this._lottieAnimation = lottie.loadAnimation<"canvas">({
      renderer: "canvas",
      loop: options.loop ?? false,
      autoplay: options.autoplay ?? false,
      animationData: this._file,
      rendererSettings: {
        context: this._canvas?.getContext("2d"),
        clearCanvas: true,
      },
    } as any);
    if (options.speed) {
      this._lottieAnimation.setSpeed(options.speed || 1);
    }
  }

  private initEvent() {
    // 当动画播放完成时触发
    this._lottieAnimation?.addEventListener("complete", () => {
      this.onCompleted?.();
    });

    // onProgress
    this._lottieAnimation?.addEventListener("enterFrame", () => {
      if (this._lottieAnimation) {
        this.enterFrame?.(this._lottieAnimation?.currentFrame);

        this.onProgress?.(
          (this._lottieAnimation?.currentFrame /
            this._lottieAnimation?.totalFrames) *
            100 || 0,
        );
      }
    });
  }

  get currentFrame() {
    return this._lottieAnimation?.currentFrame || 0;
  }

  play() {
    if (!this._playing) {
      this._playing = true;
      this._lottieAnimation?.goToAndPlay(0, true);
    }
  }

  stop() {
    if (this._playing) {
      this._playing = false;
      this._lottieAnimation?.pause();
    }
  }

  destroy() {
    this.stop();
    this._lottieAnimation?.destroy();
  }
}
