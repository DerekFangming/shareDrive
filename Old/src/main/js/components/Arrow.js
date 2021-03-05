import React from 'react';
import arrow from '../../resources/static/arrow.png';

const Arrow = (props) => {
	const size = props.size == undefined ? 15 : props.size;
	
	return (
		<img src={arrow} width={size} height={size}></img>
	)
}

export default Arrow;
