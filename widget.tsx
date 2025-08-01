import './hailAnalysis.css'
import { DataSourceConstructorOptions, DataSourceJson, Immutable, React, type AllWidgetProps } from 'jimu-core'
import { type IMConfig } from '../config'
import { useEffect, useRef, useState } from 'react'
import { MapViewManager } from 'jimu-arcgis'
import * as geoprocessor from "@arcgis/core/rest/geoprocessor.js";
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import { DataSourceManager, DataSourceTypes } from 'jimu-core';

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

				let hailLayer = new FeatureLayer({
					source: layer.value.features,
					objectIdField: 'OBJECTID',
					geometryType: 'polygon',
					fields: layer.value.fields,
					title: `Hail Swath`,
					opacity: 0.6,
					layerId: 0,
				})

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

	return (
		<div>
			{!showTable ? (
			// FIRST WINDOW: Date picker + submit button
			<div className="canopy-page-container">
				{/* Date Picker */}
				<input
				type="text"
				className="text-box"
				placeholder="YYYY-MM-DD"
				value={stormDate}
				onChange={(e) => setStormDate(e.target.value)}
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
			</div>
			) : (
			// SECOND WINDOW: Table + back button
			<div className="canopy-page-container">
				<button
					className="button"
					onClick={() => setShowTable(false)}
					style={{ marginBottom: 10 }}
				>
					← Back to Date Selection
				</button>

				{/* Render tables for each label */}
				{tableData.map((group, idx) => (
					<div key={idx} style={{ marginBottom: 30 }}>
					<h3>{group.label}</h3>
					<table className="hail-table">
						<thead>
						<tr>
							{group.columns.map((col: string) => (
							<th key={col}>{col}</th>
							))}
						</tr>
						</thead>
						<tbody>
						{group.rows.map((row, rowIndex) => (
							<tr key={rowIndex}>
							{group.columns.map((col: string) => (
								<td key={col}>{row[col]}</td>
							))}
							</tr>
						))}
						</tbody>
					</table>
					</div>
				))}
			</div>
		)}
	</div>
)}