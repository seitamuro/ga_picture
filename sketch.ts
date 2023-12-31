import p5 from 'p5'

import target_image from './red.jpg'

const population = 20;
const next_generation_of_best = 3;
const crossover_variation = 0.1;
const crossover_rate = 0.8;
const mutation_variation = 0.1;
const mutation_rate = 0.01;

const sketch = (p: p5) => {
    let img: p5.Image;
    let image_width: number;
    let image_height: number;
    let genomes: Genome[] = [];

    p.setup = () => {
        p.background(0);
        image_width = img.width;
        image_height = img.height;
        p.createCanvas(image_width * population, image_height * 3, p.P2D);
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
            const parent_idx1 = Math.floor(MyRandom() * next_generation_of_best);
            const parent_idx2 = Math.floor(MyRandom() * population);

            // 交叉
            new_genomes.push(genomes[parent_idx1].crossover(genomes[parent_idx2]));

            // 突然変異
            new_genomes[i].mutation();
        }

        // 画面上に個体の画像を表示
        new_genomes.forEach((genome, i) => {
            genome.show(image_width * i, image_height);
        })

        // 評価する
        p.loadPixels();
        img.loadPixels();
        for (let i = 0; i < population; i++) {
            new_genomes[i].fitness = fitness(img.pixels, get_image_pixels(p.pixels, i));
        }

        /*for (let k = 0; k < population; k++) {
            const _img = get_image_pixels(p.pixels, k);
            for (let i = 0; i < image_width; i++) {
                for (let j = 0; j < image_height; j++) {
                    const pixelIndex = (j * image_width * population + i + image_width * k + image_width * population * 2 * image_height) * 4;
                    //p.pixels[pixelIndex + 0] = p.pixels[(i * image_width * 4 + j) * 4 + 0]; // Red
                    //p.pixels[pixelIndex + 1] = p.pixels[(i * image_width * 4 + j) * 4 + 1]; // Red
                    //p.pixels[pixelIndex + 2] = p.pixels[(i * image_width * 4 + j) * 4 + 2]; // Red
                    //p.pixels[pixelIndex + 3] = p.pixels[(i * image_width * 4 + j) * 4 + 3]; // Red
                    //console.log("rgba: ", _img[i * image_width + j + 0], _img[i * image_width + j + 1], _img[i * image_width + j + 2], _img[i * image_width + j + 3])
                    p.pixels[pixelIndex + 0] = _img[(j * image_width + i) * 4 + 0]; // Red
                    p.pixels[pixelIndex + 1] = _img[(j * image_width + i) * 4 + 1]; // Green
                    p.pixels[pixelIndex + 2] = _img[(j * image_width + i) * 4 + 2]; // Blue
                    p.pixels[pixelIndex + 3] = _img[(j * image_width + i) * 4 + 3]; // Alpha
                }
            }
        }
        p.updatePixels();*/


        // 次世代を選択
        // 上位5個体を次世代に残し、残りの5個体は上位5個体を除きランダムに選択する。
        genomes = genomes.concat(new_genomes);
        genomes.sort((a, b) => {
            const fitness_a = a.fitness === null ? 99999999999999 : a.fitness;
            const fitness_b = b.fitness === null ? 99999999999999 : b.fitness;
            return fitness_a - fitness_b;
        })
        const next_generation = [];
        for (let i = 0; i < population; i++) {
            if (i < next_generation_of_best) {
                next_generation.push(genomes[0]);
                genomes.splice(0, 1);
            } else {
                const idx = Math.floor(MyRandom() * (population - next_generation_of_best) + next_generation_of_best);
                next_generation.push(genomes[idx]);
                genomes.splice(idx, 1);
            }
        }
        genomes = next_generation;
        genomes[0].show(image_width, 0);
        const fitnesses = genomes.map(genome => genome.fitness);
        console.log("next generation fitness: ", fitnesses);
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
                const start = p.createVector(MyRandom(), MyRandom());
                const end = p.createVector(MyRandom(), MyRandom());
                const color = p.color(MyRandom() * 255, MyRandom() * 255, MyRandom() * 255);
                lines.push(new Line(start, end, color));
            }
            return lines as Lines;
        }

        crossover(other: Genome): Genome {
            const lines: Line[] = [];
            other.lines.forEach((line, i) => {
                let start = this.lines[i].start;
                if (MyRandom() < crossover_rate) {
                    start = p5.Vector.add(this.lines[i].start, p.createVector(-MyRandom() * 2 * crossover_variation + crossover_variation, MyRandom() * 2 * crossover_variation - crossover_variation).mult(line.start));
                }

                let end = this.lines[i].end;
                if (MyRandom() < crossover_rate) {
                    end = p5.Vector.add(this.lines[i].end, p.createVector(-MyRandom() * 2 * crossover_variation + crossover_variation, MyRandom() * 2 * crossover_variation - crossover_variation).mult(line.end));
                }

                let red = p.red(this.lines[i].color);
                if (MyRandom() < crossover_rate) {
                    red = p.red(this.lines[i].color) + p.red(line.color) * (-MyRandom() * 2 * crossover_variation + crossover_variation);
                }
                let green = p.green(this.lines[i].color);
                if (MyRandom() < crossover_rate) {
                    green = p.green(this.lines[i].color) + p.green(line.color) * (-MyRandom() * 2 * crossover_variation + crossover_variation);
                }
                let blue = p.blue(this.lines[i].color);
                if (MyRandom() < crossover_rate) {
                    blue = p.blue(this.lines[i].color) + p.blue(line.color) * (-MyRandom() * 2 * crossover_variation + crossover_variation);
                }
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
                if (MyRandom() < mutation_rate) {
                    line.start.add(p.createVector(-MyRandom() * 2 * mutation_variation + mutation_variation, MyRandom() * 2 * mutation_variation - mutation_variation));
                }
                if (MyRandom() < mutation_rate) {
                    line.end.add(p.createVector(-MyRandom() * 2 * mutation_variation + mutation_variation, MyRandom() * 2 * mutation_variation - mutation_variation));
                }
                if (MyRandom() < mutation_rate) {
                    const red = p.red(line.color) + (-MyRandom() * 2 * mutation_variation + mutation_variation);
                    const green = p.green(line.color) + (-MyRandom() * 2 * mutation_variation + mutation_variation);
                    const blue = p.blue(line.color) + (-MyRandom() * 2 * mutation_variation + mutation_variation);
                    line.color = p.color(red, green, blue);
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
            if (i % 4 === 3) continue;
            sum += Math.abs(img1[i] - img2[i]) ^ 2;
        }
        return sum;
    }

    const MyRandom = (): number => {
        return p.random();
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
