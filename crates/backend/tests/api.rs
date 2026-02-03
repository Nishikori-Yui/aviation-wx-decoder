use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt;

#[tokio::test]
async fn healthz_ok() {
    let app = backend::build_app();
    let response = app
        .oneshot(Request::builder().uri("/healthz").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn decode_ok() {
    let app = backend::build_app();
    let payload = serde_json::json!({
        "message": "METAR RJTT 011200Z VRB03KT CAVOK 15/10 Q1017",
        "type": "metar",
        "output": { "json": true, "explain": true },
        "lang": "zh-CN",
        "detail": "normal"
    });
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/decode")
                .header("content-type", "application/json")
                .body(Body::from(payload.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

