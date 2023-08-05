import p5 from 'p5'

import target_image from './sample.jpg'

const sketch = (p: p5) => {
    let img: p5.Image;
    let image_width: number;
    let image_height: number;
    const genomes: Genome[] = [];

    p.setup = () => {
        image_width = img.width;
        image_height = img.height;
        p.createCanvas(image_width, image_height * 2);
        genomes.push(new Genome());
        genomes.push(new Genome());
        genomes.push(new Genome());
        genomes.push(new Genome());
        genomes.push(new Genome());
        genomes.push(new Genome());
    }

    p.preload = () => {
        img = p.loadImage(target_image)
    }

    p.draw = () => {
        p.image(img, 0, 0);
        genomes[0].show(0, image_height);
        console.log(genomes[0])
    }

    type Tuple<T, L extends number, A extends unknown[] = []> = A['length'] extends L ? A : Tuple<T, L, [T, ...A]>;
    type Lines = Tuple<Line, 100>; // p5.Vectorの100要素のタプル型

    class Line {
        start: p5.Vector;
        end: p5.Vector;
        color: p5.Color;

        constructor(_start: p5.Vector, _end: p5.Vector, _color: p5.Color) {
            this.start = _start;
            this.end = _end;
            this.color = _color;
        }
    }

    class Genome {
        lines: Lines;

        constructor(_lines?: Lines) {
            if (_lines === undefined) {
                _lines = this.create_random_lines();
            }
            this.lines = _lines;
        }

        create_random_lines(): Lines {
            const lines: Line[] = [];
            for (let i = 0; i < 100; i++) {
                const start = p.createVector(Math.random(), Math.random());
                const end = p.createVector(Math.random(), Math.random());
                const color = p.color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
                lines.push(new Line(start, end, color));
            }
            return lines as Lines;
        }

        crossover(other: Genome): Genome {
            const lines: Line[] = [];
            other.lines.forEach((line, i) => {
                const start = this.lines[i].start.add(p5.Vector.random2D().mult(line.start));
                const end = this.lines[i].end.add(p5.Vector.random2D().mult(line.end));
                const red = p.red(this.lines[i].color) + p.red(line.color) * (Math.random() * 2 - 1.0);
                const green = p.green(this.lines[i].color) + p.green(line.color) * (Math.random() * 2 - 1.0);
                const blue = p.blue(this.lines[i].color) + p.blue(line.color) * (Math.random() * 2 - 1.0);
                const color = p.color(red, green, blue);

                const clipped_start = clip_vector2D(start);
                const clipped_end = clip_vector2D(end);
                const clipped_color = clip_color(color);

                lines.push(new Line(clipped_start, clipped_end, clipped_color));
            })

            return new Genome(lines as Lines);
        }

        show(x: number, y: number) {
            this.lines.forEach((line) => {
                p.stroke(line.color);
                p.line(x + line.start.x * image_width, y + line.start.y * image_height, x + line.end.x * image_width, y + line.end.y * image_height);
            })
        }
    }

    const clip_vector2D = (vector: p5.Vector): p5.Vector => {
        vector.x = Math.max(0, Math.min(vector.x, 1));
        vector.y = Math.max(0, Math.min(vector.y, 1));
        return vector;
    }

    const clip_color = (vector: p5.Color): p5.Color => {
        vector.setRed(Math.max(0, Math.min(p.red(vector), 255)));
        vector.setGreen(Math.max(0, Math.min(p.green(vector), 255)));
        vector.setBlue(Math.max(0, Math.min(p.blue(vector), 255)));
        return vector;
    }
}

new p5(sketch)
