
function fitImage(sourceData, fileType) {
	const maxWidth = window.FIT_IMAGE_MAX_WIDTH;
	const maxHeight = window.FIT_IMAGE_MAX_HEIGHT;

	return new Promise ((resolved, _) => {
		if(!maxWidth || !maxHeight) {
			resolved(sourceData);
		}
		else {
			const source = new Image();
			source.onload = () => {
				let width = source.width;
				let height = source.height;

				if (width > height) {
					if (width > maxWidth) {
						height *= maxWidth / width;
						width = maxWidth;
					}
				} else {
					if (height > maxHeight) {
						width *= maxHeight / height;
						height = maxHeight;
					}
				}
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const context = canvas.getContext("2d");
				context.drawImage(source, 0, 0, width, height);

				const dataurl = canvas.toDataURL(fileType);
				resolved(dataurl);
			};
			source.src = sourceData;
		}
	})
}

export {fitImage};
