let rekognition;

let celebrities;
let unrecognized;

$(document).ready(() => {
    // Trigger file upload when upload image option is clicked
    $(".imgUploadIcon").click(() => $(".imgUploadInput").trigger("click"));

    // Handle image upload
    $(".imgUploadInput").change(imgSelected);

    // Log on to AWS anonymously
    AWSLogOn();
    AWS.region = "us-east-2";
    rekognition = new AWS.Rekognition();
});

// Anonymously log on to AWS services
function AWSLogOn() {
    // Initialize the Amazon Cognito credentials provider
    AWS.config.region = "us-east-2";
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: "us-east-2:98c70f2b-8366-4d01-84e3-cf3e5edfb3b4",
    });

    // Obtain credentials
    AWS.config.credentials.get();
}

// Event for when an image is uploaded
function imgSelected(e) {
    const file = e.target.files[0];

    // Show the user the image that they just uploaded
    $(".landingContainer").hide();

    $(".userImg").attr("src", `${URL.createObjectURL(e.target.files[0])}`);
    $(".userImg").addClass("polaroidAnimation");

    $(".imgViewContainer").show();

    // Load base64 encoded image for display
    const reader = new FileReader();
    reader.onload = ((_) => {
        return (e) => {
            $(".spinner").show();

            // Call the AWS Rekognition API
            rekognition.recognizeCelebrities({ Image: { Bytes: e.target.result } }, (err, data) => {
                let link = false;
                if (err) {
                    console.log(err, err.stack);
                    $(".statusText").text("Encountered an error");
                }
                else {
                    celebrities = data["CelebrityFaces"];
                    unrecognized = data["UnrecognizedFaces"];
                    links = [];

                    // Disabled due to complications with bounding boxes after rotating
                    // const orientation = data["OrientationCorrection"];
                    // if (orientation !== "ROTATE_0" && orientation !== undefined) {
                    //     const correction = orientation.split("_")[1];
                    //     $(".userImg").css("transform", `rotate(${correction}deg)`);
                    // }

                    const imgWidth = $(".userImg").width();
                    const imgHeight = $(".userImg").height();
                    $(".userImgOverlay").width(imgWidth);
                    $(".userImgOverlay").height(imgHeight);

                    if (celebrities.length === 0) {
                        $(".statusText").text((unrecognized.length === 1) 
                            ? "No Celebrities Found"
                            : "No Faces Found");
                    } else {
                        if (celebrities.length === 1) {
                            $(".statusLinkedText").text(celebrities[0]["Name"]);
                            $(".statusLinkedText").attr("href", `https://${celebrities[0]["Urls"][0]}`);
                        } else {
                            $(".statusText").text(`${celebrities.length} Celebrities Found`);
                        }

                        for (let c = 0; c < celebrities.length; c++) {
                            const rekID = celebrities[c]["Id"];

                            const box = celebrities[c]["Face"]["BoundingBox"];
                            const boxLeft = Math.round(box["Left"] * imgWidth) + "px";
                            const boxWidth = Math.round(box["Width"] * imgWidth) + "px";
                            const boxTop = Math.round(box["Top"] * imgHeight) + "px";
                            const boxHeight = Math.round(box["Height"] * imgHeight) + "px";

                            $(".userImgOverlay").append($("<a></a>")
                                .attr({ "id": rekID, "title": celebrities[c]["Name"], "href": `https://${celebrities[c]["Urls"][0]}`, "target": "_blank" })
                                .css({ "width": boxWidth, "height": boxHeight, "margin-left": boxLeft, "margin-top": boxTop })
                                .addClass("boundingBox"));
                        }
                    }

                    for (let u = 0; u < unrecognized.length; u++) {
                        const box = unrecognized[u]["BoundingBox"];
                        const boxLeft = Math.round(box["Left"] * imgWidth) + "px";
                        const boxWidth = Math.round(box["Width"] * imgWidth) + "px";
                        const boxTop = Math.round(box["Top"] * imgHeight) + "px";
                        const boxHeight = Math.round(box["Height"] * imgHeight) + "px";

                        $(".userImgOverlay").append($("<div></div>")
                            .attr({ "title": "Unknown" })
                            .css({ "width": boxWidth, "height": boxHeight, "margin-left": boxLeft, "margin-top": boxTop })
                            .addClass("boundingBoxUnknown"));
                    }
                }
                
                $(".spinner").hide();
                link ? $(".statusLinkedText").fadeIn() : $(".statusText").fadeIn();
            });    
        };
    })(file);

    reader.readAsArrayBuffer(file);
}

// Prepare for new image
function resetToDefault() {
    celebrities = [];
    unrecognized = [];

    $(".imgViewContainer").hide();

    $(".userImg").removeAttr("src");
    $(".userImg").removeClass("polaroidAnimation");
    $(".userImg").css("transform", "");
    $(".statusText").text("");
    $(".statusLinkedText").text("");
    $(".statusLinkedText").removeAttr("href");

    $(".landingContainer").fadeIn();
}