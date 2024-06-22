import { wire } from './wire.mjs'

export const front = {
  name: 'barbara.front',
  after: wire,
  measurements: [
    'underbust',
    'hpsToBust',
    'bustPointToUnderbust',
    'highBustFront',
    'bustFront',
    'bustSpan',
    'shoulderToShoulder',
    'shoulderSlope',
    'neck',
    'waistToArmpit',
    'waistToUnderbust',
  ],
  options: {
    // Static
    highBustFrontFactor: 0.5,
    // Fit
    underbustEase: { pct: 10, min: 0, max: 20, menu: 'fit' },
    // Style
    braType: {
      dflt: 'wiredBra',
      list: ['wiredBra', 'wirelessBra', 'bralette', 'sportBra'],
      menu: 'style',
    },
    armSideBend: { pct: 50, min: 0, max: 100, menu: 'style.armSide' },
    armSideDropAngle: { pct: 50, min: 0, max: 100, menu: 'style.armSide' },
    wingHeight: { pct: 80, min: 0, max: 100, menu: 'style' },
    bandDepth: { pct: 10, min: 0, max: 100, menu: 'style' },
    necklineDrop: { pct: 25, min: 0, max: 75, menu: 'style.neckline' },
    necklineDropAngle: { pct: 0, min: 0, max: 100, menu: 'style.neckline' },
    necklineBend: { pct: 100, min: 0, max: 100, menu: 'style.neckline' },
    strapArmAngle: { pct: 100, min: 0, max: 100, menu: 'style.armSide' },
    strapNecklineAngle: { pct: 0, min: 0, max: 100, menu: 'style.neckline' },
    shoulderStrapPlacement: { pct: 30, min: 10, max: 85, menu: 'style' },
    shoulderStrapWidth: { pct: 14, min: 0, max: 50, menu: 'style' },
    strapHeight: { pct: 0, min: 0, max: 100, menu: 'style' },
    // Advanced
    withDart: { bool: false, menu: 'advanced' },
    dartLength: { pct: 0, min: 0, max: 45, menu: 'advanced' },
  },
  draft: ({
    part,
    Path,
    Point,
    paths,
    points,
    options,
    measurements,
    macro,
    utils,
    store,
    expand,
    sa,
  }) => {
    // Construct the bottom of the front
    points.wingBottom = new Point(0, 0)
    points.middleBottom = points.wingBottom.shift(0, measurements.underbust / 4)
    points.wingBottom2 = points.wingBottom.shift(
      -90,
      measurements.waistToUnderbust * options.bandDepth
    )
    points.middleBottom2 = points.middleBottom.shift(
      -90,
      measurements.waistToUnderbust * options.bandDepth
    )
    points.middleTop = points.middleBottom.shift(
      90,
      (measurements.bustPointToUnderbust + measurements.hpsToBust) * options.necklineDrop
    )
    points.armpit = new Point(
      points.middleBottom.x - measurements.highBustFront * options.highBustFrontFactor,
      points.wingBottom.y - (measurements.waistToArmpit - measurements.waistToUnderbust)
    )

    // Transfer of points from barbara.wire
    points.wireLRight = store
      .get('wire.pointsLeft')[0]
      .translate(0, store.get('wire.underwireLeftHeight'))
    points.wireLLeft = store
      .get('wire.pointsLeft')[6]
      .translate(0, store.get('wire.underwireLeftHeight'))
    points.wireMiddle = utils.beamIntersectsY(
      points.middleBottom,
      points.middleTop,
      points.wireLRight.y
    )
    points.wireRLeft = store
      .get('wire.pointsRight')[0]
      .translate(0, store.get('wire.underwireRightHeight'))
    points.wireRRight = store
      .get('wire.pointsRight')[6]
      .translate(0, store.get('wire.underwireRightHeight'))

    if (options.braType == 'bralette' || options.braType == 'sportBra') {
      points.wingTop = points.wingBottom.shiftFractionTowards(points.armpit, options.wingHeight)
    } else {
      points.wingTopMax = utils.beamIntersectsY(
        points.armpit,
        points.wingBottom2,
        points.wireLLeft.y
      )
      points.wingTop = points.wingBottom.shiftFractionTowards(points.wingTopMax, options.wingHeight)
    }

    // Construct the shoudler strap from the edge of the neck
    let neckRadius = measurements.neck / (2 * 3.14)
    points.neckLeft = points.middleBottom.translate(
      -neckRadius,
      -(measurements.bustPointToUnderbust + measurements.hpsToBust)
    )
    points.strapRightBase = points.neckLeft.shift(
      180 + measurements.shoulderSlope,
      (measurements.shoulderToShoulder / 2 -
        points.neckLeft.dx(points.middleBottom) -
        (measurements.shoulderToShoulder / 2 - points.neckLeft.dx(points.middleBottom)) *
          options.shoulderStrapWidth) *
        options.shoulderStrapPlacement
    )
    points.strapRight = points.strapRightBase.shift(
      -90,
      points.strapRightBase.dy(points.middleTop) * options.strapHeight
    )
    points.strapLeft = points.strapRight.shift(
      180 + measurements.shoulderSlope,
      (measurements.shoulderToShoulder / 2 - points.neckLeft.dx(points.middleBottom)) *
        options.shoulderStrapWidth
    )
    points.strapLeftAlt = points.strapRight.shift(
      180,
      (measurements.shoulderToShoulder / 2 - points.neckLeft.dx(points.middleBottom)) *
        options.shoulderStrapWidth
    )

    // Construct the neckline
    points.necklineCorner = utils.beamsIntersect(
      points.strapRight,
      points.strapLeft.rotate(
        90 - measurements.shoulderSlope * options.strapNecklineAngle,
        points.strapRight
      ),
      points.middleTop,
      points.middleTop.shift(180 - 45 * options.necklineDropAngle, 100)
    )
    points.middleTopCp1 = points.middleTop.shiftFractionTowards(
      points.necklineCorner,
      options.necklineBend
    )
    points.strapRightCp2 = points.strapRight.shiftFractionTowards(
      points.necklineCorner,
      options.necklineBend
    )

    // Construct the arm curve
    points.armCorner = utils.beamsIntersect(
      points.strapLeft,
      points.strapRight.rotate(
        -90 - measurements.shoulderSlope * options.strapArmAngle,
        points.strapLeft
      ),
      points.wingTop,
      points.wingTop.shift(45 * options.armSideDropAngle, 100)
    )
    points.strapLeftCp1 = points.strapLeft.shiftFractionTowards(
      points.armCorner,
      options.armSideBend
    )
    points.wingTopCp2 = points.wingTop.shiftFractionTowards(points.armCorner, options.armSideBend)

    // Pinpoint the apex
    points.apex = new Point(
      points.middleBottom.x - measurements.bustSpan / 2,
      points.neckLeft.y + measurements.hpsToBust
    )

    // Construct the underbust dart
    let dartAngle =
      (45 *
        (4 * measurements.bustPointToUnderbust -
          (2 * measurements.bustFront - measurements.underbust))) /
      measurements.bustPointToUnderbust

    points.dartTop = points.apex.shift(-90, points.apex.dy(points.wingBottom) * options.dartLength)

    points.dartLeft = utils.beamsIntersect(
      points.apex,
      points.apex.shift(-90 - dartAngle / 2, 100),
      points.wingBottom2,
      points.middleBottom2
    )
    points.dartRight = utils.beamsIntersect(
      points.apex,
      points.apex.shift(-90 + dartAngle / 2, 100),
      points.wingBottom2,
      points.middleBottom2
    )

    // Support for expand setting

    paths.underwireLeft = store
      .get('wire.underwireLeft')
      .translate(0, store.get('wire.underwireLeftHeight'))
      .hide()

    paths.underwireRight = store
      .get('wire.underwireRight')
      .translate(0, store.get('wire.underwireRightHeight'))
      .hide()

    if (options.braType == 'wiredBra' || options.braType == 'wirelessBra') {
      paths.braBand = new Path()
        .move(points.wingBottom2)
        .line(points.middleBottom2)
        .noop('braBandExpand')
        .line(points.wireMiddle)
        .line(points.wireLRight)
        .combine(paths.underwireLeft.reverse())
        .move(points.wireLLeft)
        .line(points.wingTop)
        .line(points.wingBottom2)
        .addClass('fabric')
        .setHidden(expand)

      paths.braBandExpand = paths.braBand
        .clone()
        .insop(
          'braBandExpand',
          new Path()
            .line(points.wingBottom2.flipX(points.middleBottom))
            .line(points.wingTop.flipX(points.middleBottom))
            .line(points.wireRRight)
            .combine(paths.underwireRight.reverse())
            .move(points.wireRLeft)
        )
        .addClass('fabric')
        .setHidden(!expand)
    } else {
      paths.front = new Path()
        .move(points.wingBottom)
        .noop('underbustDart')
        .line(points.middleBottom)
        .line(points.middleTop)
        .curve(points.middleTopCp1, points.strapRightCp2, points.strapRight)
        .noop('strapLeft')
        .curve(points.strapLeftCp1, points.wingTopCp2, points.wingTop)
        .close()
        .hide()
        .addClass('fabric')

      paths.strapOnChest = paths.front
        .clone()
        .insop('strapLeft', new Path().line(points.strapLeftAlt))
        .setHidden(!(options.strapHeight != 0 && !options.withDart))

      paths.strapOnChestWithDart = paths.strapOnChest
        .clone()
        .insop(
          'underbustDart',
          new Path().line(points.dartLeft).line(points.dartTop).line(points.dartRight)
        )
        .setHidden(!(options.strapHeight != 0 && options.withDart))

      paths.strapToShoulder = paths.front
        .clone()
        .insop('strapLeft', new Path().line(points.strapLeft))
        .setHidden(!(options.strapHeight == 0 && !options.withDart))

      paths.strapToShoulderWithDart = paths.strapToShoulder
        .clone()
        .insop(
          'underbustDart',
          new Path().line(points.dartLeft).line(points.dartTop).line(points.dartRight)
        )
        .setHidden(!(options.strapHeight == 0 && options.withDart))
    }

    // Data storage
    store.set('front.wingTopAngle', points.wingBottom.angle(points.wingTop))
    store.set('front.wingTopDist', points.wingBottom.dist(points.wingTop))
    store.set('neckRadius', neckRadius)
    store.set('front.neckLeftStrapRightBase.dist', points.neckLeft.dist(points.strapRightBase))
    store.set('front.strapRightStrapLeft.dist', points.strapRight.dist(points.strapLeft))
    store.set('front.wingTopArmCorner.angle', points.wingTop.angle(points.armCorner))
    store.set('braType', options.braType)

    // Paperless support
    if (options.braType == 'bralette' || options.braType == 'sportBra') {
      macro('hd', {
        id: 'wMiddleToStrap',
        from: points.strapRight,
        to: points.middleBottom,
        y: points.strapRight.y - 15,
      })
      macro('vd', {
        id: 'hUnderbustToStrap',
        from: points.middleBottom,
        to: points.strapRight,
        x: points.middleBottom.x + 30,
      })
      macro('vd', {
        id: 'hMiddle',
        from: points.middleBottom2,
        to: points.middleTop,
        x: points.middleBottom2.x + 15,
      })

      if (options.strapHeight != 0) {
        macro('hd', {
          id: 'wStrapToWing',
          from: points.wingTop,
          to: points.strapLeftAlt,
          y: points.strapRight.y - 15,
        })
        macro('ld', {
          id: 'wStrap',
          from: points.strapLeftAlt,
          to: points.strapRight,
          noEndMarker: true,
          noStartMarker: true,
          d: 15,
        })
      } else {
        macro('hd', {
          id: 'wStrapToWing',
          from: points.wingTop,
          to: points.strapLeft,
          y: points.strapRight.y - 15,
        })
        macro('ld', {
          id: 'wStrap',
          from: points.strapLeft,
          to: points.strapRight,
          noEndMarker: true,
          noStartMarker: true,
          d: 15,
        })
      }
    } else {
      macro('vd', {
        id: 'hBraMiddle',
        from: points.middleBottom2,
        to: points.wireMiddle,
        x: points.middleBottom2.x + 15,
      })
    }

    macro('hd', {
      id: 'wFront',
      from: points.wingBottom2,
      to: points.middleBottom2,
      y: points.wingBottom2.y + 15,
    })
    macro('ld', {
      id: 'hWing',
      from: points.wingBottom2,
      to: points.wingTop,
      d: 15,
    })

    return part
  },
}
