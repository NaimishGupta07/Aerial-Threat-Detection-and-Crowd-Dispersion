import cv2
from ultralytics import YOLO

# Load model
model = YOLO("yolov8n.pt")

# Start webcam
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLO
    results = model(frame)

    # Draw detections
    annotated_frame = results[0].plot()

    # Show output
    cv2.imshow("YOLO Live Detection", annotated_frame)

    # Exit on ESC
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()