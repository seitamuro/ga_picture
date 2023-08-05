import p5 from 'p5'

import target_image from './sample.jpg'

const population = 10;

const sketch = (p: p5) => {
    let img: p5.Image;
    let image_width: number;
    let image_height: number;
    const genomes: Genome[] = [];

    p.setup = () => {
        p.background(255);
        image_width = img.width;
        image_height = img.height;
        p.createCanvas(image_width * population, image_height * 2);
        for (let i = 0; i < population; i++) {
            genomes.push(new Genome());
        }
        p.pixelDensity(1);
    }

    p.preload = () => {
        img = p.loadImage(target_image);
        img.loadPixels();
    }

    p.draw = () => {
        // 画面をクリア
        p.background(255);

        // 正解画像を表示
        p.image(img, 0, 0);

        // 画面上に個体の画像を表示
        genomes.forEach((genome, i) => {
            genome.show(image_width * i, image_height);
        })

        // GAを実行
        const new_genome: Genome[] = [];
        for (let i = 0; i < population; i++) {
            // 選択
            const parent_idx1 = Math.floor(Math.random() * population);
            const parent_idx2 = Math.floor(Math.random() * population);

            // 交叉
            new_genome.push(genomes[parent_idx1].crossover(genomes[parent_idx2]));

            // 突然変異
            new_genome[i].mutation();
        }

        // 次世代を選択
        genomes.concat(new_genome);
        p.loadPixels();
        img.loadPixels();
        genomes.sort((a, b) => {
            const img_a = get_image_pixels(p.pixels, genomes.indexOf(a));
            const img_b = get_image_pixels(p.pixels, genomes.indexOf(b));
            return fitness(img.pixels, img_a) - fitness(img.pixels, img_b);
        })
        genomes.splice(population, genomes.length - population);
        console.log("fitness: ", fitness(img.pixels, get_image_pixels(p.pixels, 0)));
    }

    const get_image_pixels = (img: number[], idx: number): number[] => {
        const _img: number[] = [];
        const next_pixels = image_width * population * 4;
        const base = next_pixels * image_height;
        const indexes = [];
        for (let i = 0; i < image_height; i++) {
            const offset = base + idx * image_width * 4;
            for (let j = offset + next_pixels * i; j < offset + next_pixels * i + image_width * 4; j++) {
                indexes.push(j);
            }
        }
        for (let i = 0; i < indexes.length; i++) {
            _img.push(img[indexes[i]]);
        }
        return _img;
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

        mutation() {
            this.lines.forEach((line) => {
                if (Math.random() < 0.3) {
                    line.start = p.createVector(Math.random(), Math.random());
                }
                if (Math.random() < 0.3) {
                    line.end = p.createVector(Math.random(), Math.random());
                }
                if (Math.random() < 0.3) {
                    line.color = p.color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
                }
            })
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

    const fitness = (img1: number[], img2: number[]): number => {
        let sum = 0;
        for (let i = 0; i < img1.length; i++) {
            sum += Math.abs(img1[i] - img2[i]);
        }
        return sum;
    }
}

new p5(sketch)
