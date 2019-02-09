declare module "fastintcompression" {
  declare function compress(
    val: Uint8ClampedArray<number>
  ): Uint8ClampedArray<number>;
  declare function uncompress(
    val: Uint8ClampedArray<number>
  ): Uint8ClampedArray<number>;
}
