import p5 from 'p5'

const sketch = (p: p5) => {
    let cx = 100
    let cy = 100
    let sx = 200
    let sy = 200
    let cvx = p.random(1, 2) * p.random([-1, 1])
    let cvy = p.random(1, 2) * p.random([-1, 1])
    let svx = p.random(1, 2) * p.random([-1, 1])
    let svy = p.random(1, 2) * p.random([-1, 1])

    p.setup = () => {
        p.createCanvas(400, 400)
    }

    p.draw = () => {
        p.background(220)
        p.ellipse(cx, cy, 50, 50)
        p.rect(sx, sy, 50, 50)

        if (sx < 0 || sx > p.width) {
            svx *= -1
        }
        if (sy < 0 || sy > p.height) {
            svy *= -1
        }
        sx += svx
        sy += svy
        if (cx < 0 || cx > p.width) {
            cvx *= -1
        }
        if (cy < 0 || cy > p.height) {
            cvy *= -1
        }
        cx += cvx
        cy += cvy
    }
}

new p5(sketch)
