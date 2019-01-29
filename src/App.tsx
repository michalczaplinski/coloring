import React, { RefObject, MouseEvent, Fragment } from "react";
import styled from "styled-components";
import { darken } from "polished";
import { Transition } from 'react-spring';

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

const Circle = styled("div") <{ brushSize: number }>`
  background-color: white;
  border-radius: 50%;
  width: ${({ brushSize }) => `${brushSize * 2}px`};
  height: ${({ brushSize }) => `${brushSize * 2}px`};
  border: 1px solid grey;
`;

const Palette = styled.div`
  display: flex;
`;

const Color = styled("div") <{ name: string }>`
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

class IndexPage extends React.Component {
  canvas = React.createRef();
  state = {
    mouseDown: false,
    brushSize: 20,
    canvasHeight: 400,
    canvasWidth: 600,
    color: "#f9989f"
  };

  componentDidMount() {
    const canvasWidth = document.documentElement.clientWidth;
    const canvasHeight = document.documentElement.clientHeight;
    this.setState({ canvasWidth, canvasHeight });

    window.addEventListener("resize", () => {
      const canvasWidth = document.documentElement.clientWidth;
      const canvasHeight = document.documentElement.clientHeight;
      this.setState({ canvasWidth, canvasHeight });
    });
  }

  startDrawing = (e: MouseEvent) => {
    this.drawDot(e);
  };

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
  };

  changeColor = (name: string) => {
    this.setState({ color: name });
  };

  keepDrawing = (e: MouseEvent) => {
    const { mouseDown } = this.state;
    if (mouseDown) {
      this.drawDot(e);
    }
  };

  stopDrawing = () => {
    this.setState({ mouseDown: false });
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
          style={{ backgroundColor: "mintcream" }}
          onMouseDown={this.startDrawing}
          onMouseMove={this.keepDrawing}
          onMouseUp={this.stopDrawing}
        />

        <Transition
          items={!mouseDown}
          from={{ opacity: 0 }}
          enter={{ opacity: 1 }}
          leave={{ opacity: 0 }}>
          {show =>
            show && (props =>
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
            )
          }
        </Transition>
      </Wrapper>
    );
  }
}

export default IndexPage;
