import Cocoa
import WebKit
import QuartzCore

// Animate immutable page images; WebKit's long multicolumn text never moves in 3D.
final class PageTurn: NSObject, WKScriptMessageHandler {
    weak var web: WKWebView?
    private var overlay: NSView?
    private var generation = 0
    var onFullScreen: (() -> Void)?

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let web = web, let body = message.body as? [String: Any] else { return }
        if body["fullscreen"] as? Bool == true { onFullScreen?(); return }
        if body["cancel"] as? Bool == true { cancel(); return }
        guard let x = body["x"] as? Double, let y = body["y"] as? Double,
              let w = body["w"] as? Double, let h = body["h"] as? Double else { return }
        generation += 1
        let token = generation
        let forward = body["forward"] as? Bool ?? true
        let single = body["single"] as? Bool ?? false
        let config = WKSnapshotConfiguration()
        config.rect = CGRect(x: x, y: y, width: w, height: h)
        config.afterScreenUpdates = true
        web.takeSnapshot(with: config) { [weak self] old, _ in
            guard let self = self, token == self.generation else { return }
            guard let old = old else { web.evaluateJavaScript("window.durgaNativeCommit()") { _, _ in self.finish() }; return }
            let view = NSView(frame: NSRect(x: x, y: web.bounds.height-y-h, width: w, height: h))
            view.wantsLayer = true
            guard let root = view.layer else { self.finish(); return }
            root.backgroundColor = NSColor(calibratedRed: 0.863, green: 0.812, blue: 0.690, alpha: 1).cgColor
            let cover = self.imageLayer(old, rect: root.bounds)
            root.addSublayer(cover)
            web.addSubview(view)
            self.overlay = view
            web.evaluateJavaScript("window.durgaNativeCommit()") { _, error in
                guard token == self.generation else { return }
                guard error == nil else { self.finish(); return }
                // Snapshot waits for the newly committed spread to paint.
                web.takeSnapshot(with: config) { [weak self] new, _ in
                    guard let self = self, token == self.generation else { return }
                    guard let new = new else { self.finish(); return }
                    self.animate(old: old, new: new, root: root, forward: forward, single: single)
                }
            }
        }
    }

    private func imageLayer(_ image: NSImage, rect: CGRect, half: Int? = nil) -> CALayer {
        let layer = CALayer()
        layer.frame = rect
        var r = CGRect(origin: .zero, size: image.size)
        if let cg = image.cgImage(forProposedRect: &r, context: nil, hints: nil) {
            if let half = half {
                layer.contents = cg.cropping(to: CGRect(x: CGFloat(half)*CGFloat(cg.width)/2, y: 0, width: CGFloat(cg.width)/2, height: CGFloat(cg.height)))
            } else { layer.contents = cg }
        }
        layer.contentsGravity = .resize
        layer.contentsScale = NSScreen.main?.backingScaleFactor ?? 2
        return layer
    }

    private func animate(old: NSImage, new: NSImage, root: CALayer, forward: Bool, single: Bool) {
        let w = root.bounds.width, h = root.bounds.height
        let half = single ? w : w/2
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        // Destination underneath, with the stationary old page above it.
        root.sublayers?.forEach { $0.removeFromSuperlayer() }
        root.addSublayer(imageLayer(new, rect: root.bounds))
        if !single { root.addSublayer(imageLayer(old, rect: CGRect(x: forward ? 0 : half, y: 0, width: half, height: h), half: single ? nil : (forward ? 0 : 1))) }
        var perspective = CATransform3DIdentity
        perspective.m34 = -1/2400
        root.sublayerTransform = perspective
        let leaf = CATransformLayer()
        leaf.bounds = CGRect(x: 0, y: 0, width: half, height: h)
        leaf.anchorPoint = CGPoint(x: forward ? 0 : 1, y: 0.5)
        leaf.position = CGPoint(x: single ? (forward ? 0 : w) : half, y: h/2)
        let front = imageLayer(old, rect: leaf.bounds, half: single ? nil : (forward ? 1 : 0))
        let back = imageLayer(new, rect: leaf.bounds, half: single ? nil : (forward ? 0 : 1))
        front.isDoubleSided = false; back.isDoubleSided = false
        back.transform = CATransform3DMakeRotation(.pi, 0, 1, 0)
        leaf.addSublayer(front); leaf.addSublayer(back)
        root.addSublayer(leaf)
        CATransaction.commit()
        let rotation = CABasicAnimation(keyPath: "transform.rotation.y")
        rotation.fromValue = 0
        rotation.toValue = forward ? -Double.pi : Double.pi
        rotation.duration = 0.72
        rotation.timingFunction = CAMediaTimingFunction(controlPoints: 0.32, 0.0, 0.2, 1.0)
        CATransaction.begin()
        CATransaction.setCompletionBlock { [weak self] in self?.finish() }
        CATransaction.setDisableActions(true)
        leaf.transform = CATransform3DMakeRotation(forward ? -.pi : .pi, 0, 1, 0)
        leaf.add(rotation, forKey: "pageTurn")
        CATransaction.commit()
    }

    func cancel() {
        generation += 1
        finish()
    }
    private func finish() {
        overlay?.removeFromSuperview(); overlay = nil
        web?.evaluateJavaScript("window.durgaNativeFinish && window.durgaNativeFinish()", completionHandler: nil)
    }
}
