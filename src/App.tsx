import React, { RefObject, MouseEvent } from "react";
import styled from "styled-components";
import { darken } from "polished";
import { Transition } from "react-spring";
import io from "socket.io-client";
import axios from "axios";
import compression from "fastintcompression";

const { REACT_APP_API_URL: API_URL } = process.env;

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const UI = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
`;

const BrushSizer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  height: 70px;
  width: 300px;
`;

const Circle = styled("div")<{ brushSize: number }>`
  background-color: white;
  border-radius: 50%;
  width: ${({ brushSize }) => `${brushSize * 2}px`};
  height: ${({ brushSize }) => `${brushSize * 2}px`};
  border: 1px solid grey;
`;

const Palette = styled.div`
  display: flex;
`;

const Color = styled("div")<{ name: string }>`
  height: 50px;
  width: 50px;
  margin: 2px;
  border-radius: 3px;
  background-color: ${({ name }) => name};

  &:hover {
    cursor: pointer;
    background-color: ${({ name }) => darken(0.1, name)};
  }
`;

const ShareButton = styled("button")`
  position: absolute;
  top: 20px;
  right: 23px;
  background-color: palegoldenrod;
  border-radius: 4px;
  width: 100px;
  height: 60px;
  text-transform: uppercase;
  font-weight: 300;
`;

interface IndexPage {
  [key: string]: any;
}

class IndexPage extends React.Component {
  state = {
    mouseDown: false,
    brushSize: 20,
    canvasHeight: 400,
    canvasWidth: 600,
    canvasData: [],
    x: 0,
    y: 0,
    color: "#f9989f"
  };
  canvas = React.createRef();
  socket: any;
  stack: any;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    const canvasWidth = document.documentElement.clientWidth;
    const canvasHeight = document.documentElement.clientHeight;
    this.setState({ canvasWidth, canvasHeight });

    window.addEventListener("resize", () => {
      const canvasWidth = document.documentElement.clientWidth;
      const canvasHeight = document.documentElement.clientHeight;
      this.setState({ canvasWidth, canvasHeight });
    });

    const uuid = window.location.pathname.slice(1);

    if (uuid.length > 0) {
      this.socket = io(`${API_URL}/${uuid}`);
      this.socket.on("data", (msg: any) => {
        console.log(msg);
        const canvas = this.canvas.current as HTMLCanvasElement;
        var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        const { brushSize, color, old_x, old_y, x, y } = msg.args;
        this["_" + msg.name](ctx, brushSize, color, old_x, old_y, x, y);
      });
    }
  }

  drawDot = (e: MouseEvent) => {
    this.setState({ mouseDown: true });
    const { brushSize, color } = this.state;
    const canvas = this.canvas.current as HTMLCanvasElement;
    const { x, y } = getMousePos(canvas, e);

    var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, brushSize, brushSize, 0, 0, 2 * Math.PI);
    ctx.fill();

    const data = ctx.getImageData(0, 0, canvas.height, canvas.width);
    this.setState({ x, y, canvasData: data.data });
  };

  _keepDrawingDot = (
    ctx: CanvasRenderingContext2D,
    brushSize: number,
    color: string,
    old_x: number,
    old_y: number,
    x: number,
    y: number
  ) => {
    ctx.lineWidth = brushSize * 2;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(old_x, old_y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.ellipse(x, y, brushSize, brushSize, 0, 0, 2 * Math.PI);
    ctx.fill();
  };

  keepDrawingDot = (e: MouseEvent) => {
    this.setState({ mouseDown: true });
    const { brushSize, color, x: old_x, y: old_y } = this.state;
    const canvas = this.canvas.current as HTMLCanvasElement;
    const { x, y } = getMousePos(canvas, e);

    var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    if (this.socket) {
      this.socket.emit("data", {
        name: "keepDrawingDot",
        args: { color, brushSize, old_x, old_y, x, y }
      });
    }

    this._keepDrawingDot(ctx, brushSize, color, old_x, old_y, x, y);
    const data = ctx.getImageData(0, 0, canvas.height, canvas.width);
    this.setState({ x, y, canvasData: data.data });
  };

  startDrawing = (e: any) => this.drawDot(e);

  stopDrawing = () => this.setState({ mouseDown: false });

  changeColor = (name: string) => this.setState({ color: name });

  keepDrawing = (e: any) => {
    const { mouseDown } = this.state;
    if (mouseDown) {
      this.keepDrawingDot(e);
    }
  };

  calculateData = () => {
    const canvas = this.canvas.current as HTMLCanvasElement;

    var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const data = ctx.getImageData(0, 0, canvas.height, canvas.width);

    const result = compression.compress(data.data);
    return result;
  };

  shareDrawing = async () => {
    //TODO: if we already shared, prevent from re-sharing

    const {
      data: { uuid }
    } = await axios.get(`${API_URL}/get-uuid`);

    window.history.pushState(null, "", uuid);

    this.socket = io(`${API_URL}/${uuid}`);
    this.socket.on("data", (msg: any) => {
      console.log(msg);
      const canvas = this.canvas.current as HTMLCanvasElement;
      var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      const { brushSize, color, old_x, old_y, x, y } = msg.args;
      this["_" + msg.name](ctx, brushSize, color, old_x, old_y, x, y);
    });
  };

  render() {
    const { brushSize, canvasHeight, canvasWidth, mouseDown } = this.state;
    return (
      <Wrapper>
        <canvas
          ref={this.canvas as RefObject<HTMLCanvasElement>}
          id="canvas"
          height={canvasHeight}
          width={canvasWidth}
          onTouchStart={this.startDrawing}
          onTouchMove={this.keepDrawing}
          onTouchEnd={this.stopDrawing}
          onMouseDown={this.startDrawing}
          onMouseMove={this.keepDrawing}
          onMouseUp={this.stopDrawing}
        />
        <ShareButton onClick={() => this.shareDrawing()}> SHARE</ShareButton>

        <Transition
          items={!mouseDown}
          from={{ opacity: 0 }}
          enter={{ opacity: 1 }}
          leave={{ opacity: 0 }}
        >
          {show =>
            show &&
            (props => (
              <UI style={props}>
                <BrushSizer>
                  <input
                    name="brushSize"
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={brushSize}
                    onChange={e => this.setState({ brushSize: e.target.value })}
                  />
                  <label htmlFor="brushSize">Brush Size</label>
                  <Circle brushSize={brushSize} />
                </BrushSizer>
                <Palette>
                  <Color
                    onClick={() => this.changeColor("#f9989f")}
                    name="#f9989f"
                  />
                  <Color
                    onClick={() => this.changeColor("#fccb8f")}
                    name="#fccb8f"
                  />
                  <Color
                    onClick={() => this.changeColor("#faf096")}
                    name="#faf096"
                  />
                  <Color
                    onClick={() => this.changeColor("#c5f8c8")}
                    name="#c5f8c8"
                  />
                </Palette>
              </UI>
            ))
          }
        </Transition>
      </Wrapper>
    );
  }
}

export default IndexPage;
