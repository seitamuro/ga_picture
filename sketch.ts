import p5 from 'p5'

import target_image from './red.jpg'

const population = 10;

const sketch = (p: p5) => {
    let img: p5.Image;
    let image_width: number;
    let image_height: number;
    let genomes: Genome[] = [];

    p.setup = () => {
        p.background(0);
        image_width = img.width;
        image_height = img.height;
        p.createCanvas(image_width * population, image_height * 2, p.P2D);
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
        p.fill(0, 0, 255);
        p.rect(image_width * 2, 0, image_width * population, image_height);

        // GAを実行
        const new_genomes: Genome[] = [];
        for (let i = 0; i < population; i++) {
            // 選択
            const parent_idx1 = Math.floor(Math.random() * population);
            const parent_idx2 = Math.floor(Math.random() * population);

            // 交叉
            new_genomes.push(genomes[parent_idx1].crossover(genomes[parent_idx2]));

            // 突然変異
            new_genomes[i].mutation();
        }

        // 画面上に個体の画像を表示
        genomes[0].show(image_width, 0);
        new_genomes.forEach((genome, i) => {
            genome.show(image_width * i, image_height);
        })

        // 評価する
        p.loadPixels();
        for (let i = 0; i < population; i++) {
            new_genomes[i].fitness = fitness(img.pixels, get_image_pixels(p.pixels, i));
        }

        const img1 = get_image_pixels(p.pixels, 0);
        console.log("img1.length: ", img1.length);
        console.log("image_width, image_height: ", image_width, image_height);
        for (let i = 0; i < image_width; i++) {
            for (let j = 0; j < image_height; j++) {
                const pixelIndex = (j * image_width * population + i) * 4;
                //p.pixels[pixelIndex + 0] = p.pixels[(i * image_width * 4 + j) * 4 + 0]; // Red
                //p.pixels[pixelIndex + 1] = p.pixels[(i * image_width * 4 + j) * 4 + 1]; // Red
                //p.pixels[pixelIndex + 2] = p.pixels[(i * image_width * 4 + j) * 4 + 2]; // Red
                //p.pixels[pixelIndex + 3] = p.pixels[(i * image_width * 4 + j) * 4 + 3]; // Red
                //console.log("rgba: ", img1[i * image_width + j + 0], img1[i * image_width + j + 1], img1[i * image_width + j + 2], img1[i * image_width + j + 3])
                p.pixels[pixelIndex + 0] = img1[(j * image_width + i) * 4 + 0]; // Red
                p.pixels[pixelIndex + 1] = img1[(j * image_width + i) * 4 + 1]; // Green
                p.pixels[pixelIndex + 2] = img1[(j * image_width + i) * 4 + 2]; // Blue
                p.pixels[pixelIndex + 3] = img1[(j * image_width + i) * 4 + 3]; // Alpha
            }
        }
        p.updatePixels();


        // 次世代を選択
        genomes = genomes.concat(new_genomes);
        genomes.sort((a, b) => {
            const fitness_a = a.fitness === null ? 999999999 : a.fitness;
            const fitness_b = b.fitness === null ? 999999999 : b.fitness;
            return fitness_a - fitness_b;
        })
        genomes.splice(population, genomes.length - population);
        console.log("after fitness: ", genomes[0].fitness);
    }

    const get_image_pixels = (img: number[], idx: number): number[] => {
        const _img: number[] = [];
        const offset = (image_width * population * image_height) * 4 + image_width * idx * 4; // 正解画像 + idx画像
        const indexes = [];
        for (let j = 0; j < image_height; j++) {
            for (let i = 0; i < image_width; i++) {
                const index = offset + (j * image_width * population + i) * 4;
                indexes.push(index + 0);
                indexes.push(index + 1);
                indexes.push(index + 2);
                indexes.push(index + 3);
            }
        }
        for (let i = 0; i < indexes.length; i++) {
            /*if (i % 4 === 0 || i % 4 == 1 || i % 4 == 2) {
                _img.push(img[image_width * 4 * 4]);
            } else {
                _img.push(255);
            }*/
            _img.push(img[indexes[i]]);
        }
        console.log("img: ", img);
        console.log("_img: ", _img);
        return _img;
    }

    type Tuple<T, L extends number, A extends unknown[] = []> = A['length'] extends L ? A : Tuple<T, L, [T, ...A]>;
    type Lines = Tuple<Line, 500>; // p5.Vectorの100要素のタプル型

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
        fitness: number | null = null;

        constructor(_lines?: Lines) {
            if (_lines === undefined) {
                _lines = this.create_random_lines();
            }
            this.lines = _lines;
        }

        create_random_lines(): Lines {
            const lines: Line[] = [];
            for (let i = 0; i < 500; i++) {
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
                if (Math.random() < 0.01) {
                    line.start = p.createVector(Math.random(), Math.random());
                }
                if (Math.random() < 0.01) {
                    line.end = p.createVector(Math.random(), Math.random());
                }
                if (Math.random() < 0.01) {
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
        for (let i = 0; i < img1.length; i += 4) {
            const [h1, s1, l1] = rgbToHsl(img1[i], img1[i + 1], img1[i + 2]);
            const [h2, s2, l2] = rgbToHsl(img2[i], img2[i + 1], img2[i + 2]);
            sum += Math.abs(h1 - h2) ^ 2;
        }
        return sum;
    }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255.0;
    g /= 255.0;
    b /= 255.0;

    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);

    let h = (maxVal + minVal) / 2;
    let s = (maxVal + minVal) / 2;
    const l = (maxVal + minVal) / 2;

    if (maxVal === minVal) {
        h = s = 0; // achromatic
    } else {
        const d = maxVal - minVal;
        s = l > 0.5 ? d / (2.0 - maxVal - minVal) : d / (maxVal + minVal);

        switch (maxVal) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

new p5(sketch)
