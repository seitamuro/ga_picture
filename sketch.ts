import p5 from 'p5'

const sketch = (p: p5) => {
    p.setup = () => {
        p.createCanvas(400, 400)
    }

    p.draw = () => { }
}

new p5(sketch)
