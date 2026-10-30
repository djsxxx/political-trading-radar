import Foundation
import PDFKit
import Vision
import AppKit

guard CommandLine.arguments.count >= 3, let pdf=PDFDocument(url:URL(fileURLWithPath:CommandLine.arguments[1])) else { fatalError("PDF path and comma-separated pages required") }
let pages=CommandLine.arguments[2].split(separator:",").compactMap{Int($0)}
for n in pages {
 guard let page=pdf.page(at:n-1) else { continue }
 let rect=page.bounds(for:.mediaBox)
 let image=page.thumbnail(of:NSSize(width:rect.width*3,height:rect.height*3),for:.mediaBox)
 guard let cg=image.cgImage(forProposedRect:nil,context:nil,hints:nil) else {continue}
 let request=VNRecognizeTextRequest()
 request.recognitionLevel = .accurate
 request.recognitionLanguages = ["en-US"]
 request.usesLanguageCorrection = false
 try VNImageRequestHandler(cgImage:cg).perform([request])
 let rows=(request.results ?? []).compactMap { obs -> [String:Any]? in
  guard let c=obs.topCandidates(1).first else{return nil}
  return ["text":c.string,"confidence":c.confidence,"x":obs.boundingBox.minX,"y":obs.boundingBox.minY,"width":obs.boundingBox.width,"height":obs.boundingBox.height]
 }
 let result:[String:Any] = ["page":n,"rows":rows]
 let bytes=try JSONSerialization.data(withJSONObject:result,options:[.sortedKeys])
 if CommandLine.arguments.count>=4 {
  let folder=URL(fileURLWithPath:CommandLine.arguments[3])
  try FileManager.default.createDirectory(at:folder,withIntermediateDirectories:true)
  try bytes.write(to:folder.appendingPathComponent("page-\(n).json"))
  print("OCR page \(n): \(rows.count) regions")
 } else {print(String(data:bytes,encoding:.utf8)!)}
}
