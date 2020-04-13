
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

				const cWidth = width / maxWidth;
				const cHeight = height / maxHeight;

				if(cWidth <= 1 && cHeight <= 1) {
					resolved(sourceData);
				}
				else {
					const coeff = (cWidth > cHeight) ? cWidth : cHeight;
					width = width / coeff;
					height = height / coeff;
				}

/*				console.debug(`max: ${maxWidth} x ${maxHeight}`);
				console.debug(`source: ${source.width} x ${source.height}`);
				console.debug(`coeff: ${cWidth} x ${cHeight}`);
				console.debug(`destination: ${width} x ${height}`);*/
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
