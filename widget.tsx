import './hailAnalysis.css'
import { DataSourceConstructorOptions, DataSourceJson, Immutable, React, type AllWidgetProps } from 'jimu-core'
import { type IMConfig } from '../config'
import { useEffect, useRef, useState } from 'react'
import { MapViewManager } from 'jimu-arcgis'
import * as geoprocessor from "@arcgis/core/rest/geoprocessor.js";
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import { DataSourceManager, DataSourceTypes } from 'jimu-core';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'
import { DatePicker } from 'jimu-ui/basic/date-picker'


export default function Widget(props: AllWidgetProps<IMConfig>) {

	const [stormDate, setStormDate] = useState<string>('')
	const [status, setStatus] = useState('Waiting for user input')
	const canopyHost = useRef(window.location.hostname)
	const [isRunning, setIsRunning] = useState(false)
	const map = useRef(null)
	const [jobInfo, setJobInfo] = useState<any>(null);
	const [tableData, setTableData] = useState<any[]>([]);
	const [showTable, setShowTable] = useState(false)
	const dsManager = useRef(DataSourceManager.getInstance())
	const hailColorMap = {
		'0.75': [255, 255, 190],
		'1': [255, 255, 34],
		'1.25': [255, 212, 0],
		'1.5': [255, 157, 0],
		'1.75': [255, 102, 0],
		'2': [255, 45, 0],
		'2.25': [249, 0, 0],
		'2.5': [226, 0, 0],
		'2.75': [206, 0, 0],
		'3': [182, 0, 0],
		'3.25': [160, 0, 0],
		'3.5': [168, 0, 39],
		'3.75': [189, 0, 96]
	};
	const totalColor = {
		'Total' : [113, 153, 251]
	}
	const [hideCols, setHideCols] = useState(false);
	const toggleHideCols = () => setHideCols(prev => !prev);



	useEffect(() => {
		const viewManager = MapViewManager.getInstance()
		map.current = viewManager.getJimuMapViewById(viewManager.getAllJimuMapViewIds()[0])
		switch (canopyHost.current) {
			case 'gistest106.amica.com':
				break;
			case 'gisdev.amica.com':
				break;
			case 'gistest.amica.com':
				break;
			case 'gis.amica.com':
				break;
			default:
				canopyHost.current = 'gisdev.amica.com';
		}
	}, [])

	const HailPredictionURL = `https://${canopyHost.current}/arcgis/rest/services/GPTools/HailPredictionTool/GPServer/HailPredictionTool`;

	const fetchHailLayer = async (jobInfo) => {
		try {
			// Fetch hail layer dataz
			jobInfo.fetchResultData('Output_Hail_Layer')
			.then((layer) => {
				console.log('Retrieved hail layer data:', layer);
				console.log(layer.value.features)
				
				let line = new SimpleLineSymbol({
					style: 'solid',
					color: [110, 110, 110, 1],
					width: .5,
				})

				let hailLayer = new FeatureLayer({
					source: layer.value.features,
					objectIdField: 'OBJECTID',
					geometryType: 'polygon',
					fields: layer.value.fields,
					title: `Hail Swath`,
					opacity: 0.6,
					layerId: 0,
				})

				hailLayer.renderer = {
					type: "unique-value",  // autocasts as new UniqueValueRenderer()
					// @ts-ignore
					field: "diameter_in_label",
					defaultSymbol: {
						type: "simple-fill",
						outline: line,
						color: [209, 0, 152, 1.0]
					},
					uniqueValueInfos: [{
						value: '0.75"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [255, 255, 190, 1.0],
							outline: line
						}
					}, {
						value: '1"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [255, 255, 34, 1.0],
							outline: line
						}
					}, {
						value: "1.25\"",
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [255, 212, 0, 1.0],
							outline: line
						}
					}, {
						value: '1.5"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [255, 157, 0, 1.0],
							outline: line
						}
					}, {
						value: '1.75"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [255, 102, 0, 1.0],
							outline: line
						}
					}, {
						value: '2"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [255, 45, 0, 1.0],
							outline: line
						}
					}, {
						value: '2.25"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [249, 0, 0, 1.0],
							outline: line
						}
					}, {
						value: '2.5"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [226, 0, 0, 1.0],
							outline: line
						}
					}, {
						value: '2.75"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [206, 0, 0, 1.0],
							outline: line
						}
					}, {
						value: '3"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [182, 0, 0, 1.0],
							outline: line
						}
					}, {
						value: '3.25"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [160, 0, 0, 1.0],
							outline: line
						}
					}, {
						value: '3.5"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [168, 0, 39, 1.0],
							outline: line
						}
					}, {
						value: '3.75"',
						symbol: {
							type: "simple-fill",  // autocasts as new SimpleFillSymbol()
							color: [189, 0, 96, 1.0],
							outline: line
						}
					}]
				}

				const data: DataSourceJson = {
					id: 'hail_ds_',
					layerId: hailLayer.id,
					type: DataSourceTypes.FeatureLayer,
					label: hailLayer.title,
				}

				const dataJson = Immutable(data)
				const dataSourceOptions = {
					id: 'hail_ds_',
					layer: hailLayer,
					layerId: hailLayer.id,
					dataSourceJson: dataJson,
				}

				dsManager.current.createDataSource(dataSourceOptions).then((source) => {
					map.current.view.map.add(hailLayer)
					map.current.createJimuLayerView(hailLayer, map.current.id, hailLayer.id, source, true).then((response) => {
						//setStatus('Hail from  added')
					})
				}).catch((error) => {
					console.error('Error creating DataSource:', error);
				});
				
				return hailLayer
			})
		} catch (error) {
			console.error('[ERROR] Failed to fetch hail layer:', error);
			throw error;
		}
	};

	const fetchJsonData = async (jobInfo) => {
		try {
			// Fetch JSON data
			const result = await jobInfo.fetchResultData('Output_JSON');

			console.log('Retrieved JSON data:', result);

			// Parse the JSON data
			const jsonData = typeof result.value === 'string' 
				? JSON.parse(result.value)
				: result.value;
				
			return jsonData;
		} catch (error) {
			console.error('[ERROR] Failed to fetch JSON data:', error);
			throw error;
		}
	};

	// Main process
	const handleRunProcess = async () => {
		setIsRunning(true);
		setStatus('Running analysis...');
		
		try {
			// Submit the GP job first
			const params = {
				Date: stormDate
			};
			
			// Run the geoprocessing job
			const submitResponse = await geoprocessor.submitJob(HailPredictionURL, params);
			
			console.log('[DEBUG] Job submitted:', submitResponse);
			
			// Wait for job completion
			await submitResponse.waitForJobCompletion({
				interval: 1000,
				statusCallback: (j) => {
					console.log(`[STATUS] Job status: ${j.jobStatus}`);
					setStatus(`Processing: ${j.jobStatus}`);
				}
			});

			console.log('[DEBUG] Job complete:');
			
			// Fetch results
			const hailLayer = await fetchHailLayer(submitResponse);
			const jsonData = await fetchJsonData(submitResponse);


			if (jsonData && Array.isArray(jsonData)) {
				setTableData(jsonData);
				setStatus('Analysis complete');
				setShowTable(true);
				console.log('[SUCCESS] Table data loaded');
			} else {
				setStatus('Invalid data format returned');
				console.warn('[WARNING] Invalid data format:', jsonData);
			}
		} catch (error) {
			console.error('[ERROR] Processing failed:', error);
			setStatus('Failed to process results');
		} finally {
			setIsRunning(false);
		}
	};

	type TableRow = {
		diam_in?: number;
		[key: string]: any;
	};

	const DIAMETER_FIELD = 'diam_in';

	const hasMultipleValues = (row: TableRow): boolean => {
		if (!row) return false;

		const fields = Object.keys(row);
		const nonEmptyFields = fields.filter(field => {
			const value = row[field];
			return (
				field !== DIAMETER_FIELD && 
				value !== null && 
				value !== undefined && 
				value !== '' &&
				// Add check for zero values
				!(typeof value === 'number' && value === 0)
			);
		});

		return nonEmptyFields.length > 0;
	};

	return (
		<div>
			{!showTable ? (
			// FIRST WINDOW: Date picker + submit button
			<div className="canopy-page-container">
				{/* Date Picker */}
				<DatePicker className="canopy-FormDate"
				aria-describedby="canopy-date-picker-desc-id"
				aria-label="DateTime picker label"
				format="shortDate"
				showDoneButton
				onChange={(evt) => setStormDate(new Date(evt))}
				selectedDate={stormDate}
				strategy="fixed"
				runtime
				maxDate={new Date()}
				/>
				{/* Submit Button */}
				<button
				className="button"
				onClick={handleRunProcess}
				disabled={isRunning}
				>
				{isRunning ? 'Running...' : 'Run Analysis'}
				</button>
				<div>{status}</div>
				<div className="helper-text">
					Select a date, and the program will analyze historical hail event data 
					from the database to predict the expected number of insurance claims.
					<ul>
						<li>The 10th to 90th percentile range represents the span within which 90% 
						of potential claims are likely to fall.</li>
						<li>The 25th to 75th percentile range captures the middle 50% of expected claims.</li>
						<li>The 50th percentile reflects the median, or approximate average, number of claims.</li>
					</ul>
				</div>
			</div>
			) : (
			// SECOND WINDOW: Table + back button
			<div className="canopy-page-container table-wrapper">
				<div className="back-button">
					<button
						className="button"
						onClick={() => setShowTable(false)}
					>
						← Back to Date Selection
					</button>
				</div>

				<div className="scrollable-container">
					{tableData
						// First filter out groups with no valid rows
						.filter(group => group.rows.some(hasMultipleValues))
						// Map through each remaining group to create table sections
						.map((group, idx) => (
							<div key={idx} style={{ marginBottom: 30 }}>
							{/* Display the group label as a heading */}
								<h3>{group.label}</h3>
								<table className="hail-table">
									<thead>
										<tr>
											{/* Create table headers from column names */}
											{group.columns.map((col: string) => (
												<th key={col}>{col}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{group.rows
											.filter(hasMultipleValues)
											.map((row, rowIndex, rowArray) => {
												const hiddenIndexes = [2, 6]; // 3rd and 7th columns (0-based)
												const visibleColumns = hideCols
													? group.columns.filter((_, idx) => !hiddenIndexes.includes(idx))
													: group.columns;
												const isTotalRow = rowIndex === rowArray.length - 1;
												const diameterValue = String(row[DIAMETER_FIELD]);
												const colorArray = hailColorMap?.[diameterValue];
												const rowStyle = isTotalRow
													? { backgroundColor: `rgb(${totalColor['Total'].join(',')})` }
													: colorArray
														? { backgroundColor: `rgb(${colorArray.join(',')})` }
														: {};

												return (
												 <tr key={rowIndex} style={rowStyle}>
													{visibleColumns.map((col: string, colIndex) => {
													// Get original column index for logic like empty first cell, 'Total', etc.
													const originalIndex = group.columns.indexOf(col);

													let cellContent = '';
													if (rowIndex === 0 && originalIndex === 0) {
														cellContent = '';
													} else if (originalIndex === 0 && isTotalRow) {
														cellContent = 'Total';
													} else if (originalIndex === 0) {
														cellContent = `${row[col]}"`;
													} else {
														cellContent = row[col];
													}

													return <td key={col}>{cellContent}</td>;
													})}
												</tr>
												);
											})}
									</tbody>
								</table>
							</div>
						))}
						<button className="button" onClick={toggleHideCols}>
							Show more data
						</button>
					</div>	
				</div>
			)}
		</div>
	);
}