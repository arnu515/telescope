import {
	Copy,
	Mic,
	MicMute,
	PhoneDisabled,
	VideoCamera,
	VideoCameraOff
} from "iconoir-react"
import React from "react"
import video from "twilio-video"
import { ErrorObject } from "../util/types"
import ErrorAlert from "./ErrorAlert"

const Call: React.FC<{ token: string }> = ({ token }) => {
	const [error, setError] = React.useState<ErrorObject | undefined>()
	const [micButtonEnabled, setMicButtonEnabled] = React.useState(false)
	const [cameraButtonEnabled, setCameraButtonEnabled] = React.useState(false)
	const [connectedRoom, setConnectedRoom] = React.useState<video.Room | null>(
		null
	)
	const [other, setOther] = React.useState<video.RemoteParticipant | null>(null)
	const videoEl = React.useRef<HTMLVideoElement>(null)

	const [audioTrack, setAudioTrack] =
		React.useState<video.LocalAudioTrack | null>(null)
	const [videoTrack, setVideoTrack] =
		React.useState<video.LocalVideoTrack | null>(null)

	const [isOtherMuted, setIsOtherMuted] = React.useState(true)
	const [isOtherCameraOff, setIsOtherCameraOff] = React.useState(true)

	const [otherNickname, setOtherNickname] = React.useState("")
	const [otherAvatarUrl, setOtherAvatarUrl] = React.useState(
		"https://i.imgur.com/GhJz0Ks.png"
	)

	async function getOtherIdentity(id: string) {
		const res = await fetch(
			process.env.NEXT_PUBLIC_API_URL +
				"/api/integrations/calls/identity?identity=" +
				id
		)
		const data = await res.json()
		setOtherNickname(data.nickname || "")
		setOtherAvatarUrl(data.avatarUrl || "https://i.imgur.com/GhJz0Ks.png")
	}

	function setParticipant(p: video.RemoteParticipant | null) {
		if (!p) {
			if (videoEl.current) videoEl.current.srcObject = null
			setOther(null)
			return
		}
		getOtherIdentity(p.identity)
		function publishTrack(publication: video.RemoteTrackPublication) {
			if (publication.isSubscribed) {
				;(publication.track as any).attach(videoEl.current)
			}
			publication.on("subscribed", track => {
				if (track.kind === "audio") setIsOtherMuted(false)
				if (track.kind === "video") setIsOtherCameraOff(false)
				;(track as any).attach(videoEl.current)
			})
			publication.on("unsubscribed", track => {
				if (track.kind === "audio") setIsOtherMuted(true)
				if (track.kind === "video") setIsOtherCameraOff(true)
				;(track as any).detach().forEach((e: any) => {
					e.srcObject = null
					e.remove()
				})
			})
		}

		p.tracks.forEach(publishTrack)
		p.on("trackPublished", publishTrack)
		setOther(p)
	}

	React.useEffect(() => {
		if (!connectedRoom)
			video.connect(token, { audio: false, video: false }).then(room => {
				room.participants.forEach(p => setParticipant(p))

				room.on("participantConnected", p => {
					setParticipant(p)
				})
				room.on("participantDisconnected", () => {
					setParticipant(null)
				})
				room.on("participantReconnecting", () => {
					setParticipant(null)
				})
				room.on("participantReconnected", p => {
					setParticipant(p)
				})

				setConnectedRoom(room)

				console.log(room)
			})

		navigator.mediaDevices.enumerateDevices().then(devices => {
			devices.forEach(device => {
				if (device.kind === "audioinput") {
					setMicButtonEnabled(true)
				}
				if (device.kind === "videoinput") {
					setCameraButtonEnabled(true)
				}
			})
		})

		return () => {
			connectedRoom?.disconnect?.()
		}
	}, [])

	if (!connectedRoom)
		return <h1 className="m-4 text-center text-4xl font-bold">Connecting...</h1>

	const toggleMute = async () => {
		if (!micButtonEnabled) return
		try {
			if (!audioTrack) {
				const track = await video.createLocalAudioTrack({
					echoCancellation: true,
					noiseSuppression: true
				})
				connectedRoom.localParticipant.publishTrack(track)
				setAudioTrack(track)
			} else {
				audioTrack.stop()
				connectedRoom.localParticipant.unpublishTrack(audioTrack)
				setAudioTrack(null)
			}
		} catch (e) {
			setError({
				error: "An error occured",
				error_description: (e as any).message
			})
		}
	}

	const toggleCamera = async () => {
		if (!cameraButtonEnabled) return
		try {
			if (!videoTrack) {
				const track = await video.createLocalVideoTrack({
					height: 360,
					width: 480
				})
				connectedRoom.localParticipant.publishTrack(track)
				setVideoTrack(track)
			} else {
				videoTrack.stop()
				connectedRoom.localParticipant.unpublishTrack(videoTrack)
				setVideoTrack(null)
			}
		} catch (e) {
			setError({
				error: "An error occured",
				error_description: (e as any).message
			})
		}
	}

	const copyMeetingLink = () => {
		if ("clipboard" in navigator) {
			if (typeof navigator.clipboard.writeText === "function") {
				navigator.clipboard.writeText(window.location.href)
				alert("Copied to clipboard!")
				return
			}
		}

		const textarea = document.createElement("textarea")
		textarea.value = window.location.href
		document.body.appendChild(textarea)
		textarea.select()
		document.execCommand("copy")
		textarea.remove()
		alert("Copied to clipboard!")
	}

	const leaveMeeting = () => {
		if (window.confirm("Are you sure?")) window.location.href = "/"
	}

	return (
		<div className="mx-auto max-w-screen-lg py-12">
			<h1 className="my-4 text-center text-5xl font-bold">In a call</h1>
			{error && (
				<div className="my-12">
					<ErrorAlert
						error={error}
						dismissable={true}
						onDismiss={() => setError(undefined)}
					/>
				</div>
			)}
			<div className="mt-8 mb-4 flex items-center justify-center gap-2 text-xl">
				<button
					className={`button ${
						micButtonEnabled
							? "cursor-pointer bg-blue-500"
							: "cursor-not-allowed bg-gray-500"
					}`}
					onClick={toggleMute}
					disabled={!micButtonEnabled}
					title={
						micButtonEnabled
							? audioTrack
								? "Mute mic"
								: "Unmute mic"
							: "No microphone detected"
					}
					aria-label={
						micButtonEnabled
							? audioTrack
								? "Mute mic"
								: "Unmute mic"
							: "No microphone detected"
					}
				>
					{audioTrack ? <Mic /> : <MicMute />}
				</button>
				<button
					className={`button ${
						cameraButtonEnabled
							? "cursor-pointer bg-success"
							: "cursor-not-allowed bg-gray-500"
					}`}
					onClick={toggleCamera}
					disabled={!cameraButtonEnabled}
					title={
						cameraButtonEnabled
							? videoTrack
								? "Turn off camera"
								: "Turn on camera"
							: "No camera detected"
					}
					aria-label={
						cameraButtonEnabled
							? videoTrack
								? "Turn off camera"
								: "Turn on camera"
							: "No camera detected"
					}
				>
					{videoTrack ? <VideoCamera /> : <VideoCameraOff />}
				</button>
				<button
					className="button bg-orange-500"
					onClick={copyMeetingLink}
					title="Copy meeting link"
					aria-label="Copy meeting link"
				>
					<Copy />
				</button>
				<button
					className="button bg-error"
					onClick={leaveMeeting}
					title="Leave meeting"
					aria-label="Leave meeting"
				>
					<PhoneDisabled />
				</button>
			</div>
			<div className="m-4">
				{other ? (
					<>
						{!isOtherCameraOff ? (
							<video
								ref={videoEl}
								width={480}
								height={360}
								className="mx-auto bg-black"
							></video>
						) : (
							<div
								className="relative mx-auto flex items-center justify-center bg-black"
								style={{ width: "480px", height: "360px" }}
							>
								<img
									src={otherAvatarUrl}
									alt="Avatar of other user"
									width={128}
									className="mx-auto"
									height={128}
								/>
								<span className="absolute bottom-2 right-2 text-gray-500">
									<VideoCameraOff />
								</span>
							</div>
						)}
						<p className="mt-4 flex items-center justify-center gap-2 text-center text-2xl font-medium text-gray-500">
							{otherNickname}{" "}
							{isOtherMuted ? (
								<MicMute width={24} height={24} />
							) : (
								<Mic width={24} height={24} />
							)}
						</p>
					</>
				) : (
					<p className="my-4 text-center text-2xl font-medium text-gray-500">
						Echo! It's empty in here.{" "}
						<span
							className="cursor-pointer text-white underline"
							role="button"
							onClick={copyMeetingLink}
						>
							Copy meeting link
						</span>
					</p>
				)}
			</div>
		</div>
	)
}

export default Call
