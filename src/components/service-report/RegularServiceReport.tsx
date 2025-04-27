import React from 'react';
import { usePDF } from 'react-to-pdf';
import logoPestindo from "@/assets/logo pestindo 2.png";
import { formatToRupiah } from '@/lib/utils';

// Type definitions
interface Pest {
    name: string;
    code: string;
    count: number;
}

interface Action {
    code: string;
    name: string;
}

interface Equipment {
    code: string;
    name: string;
}

interface LocationService {
    location: string;
    pests: Pest[];
    actions: Action[];
    equipments: Equipment[];
    notes: string;
    recommendations: Recommendation[];
}

interface Recommendation {
    notes: string;
    equipmentCodes: string[];
}

interface Photo {
    url: string;
    alt: string;
}


interface Chemical {
    name: string;
    dosage: string;
}

interface RegularServiceReportProps {
    reportDate: string;
    customerName: string;
    picCustomer: string;
    technician: string;
    jobType: string;
    serviceType: string;
    locationServices: LocationService[];
    photos: Photo[];
    chemicals?: Chemical[];
    totalAmount?: number;
}


const RegularServiceReport: React.FC<RegularServiceReportProps> = ({
    reportDate,
    customerName,
    picCustomer,
    technician,
    jobType,
    serviceType,
    locationServices,
    photos,
    chemicals,
    totalAmount
}) => {
    const { toPDF, targetRef } = usePDF({
        filename: `Laporan-Service-${customerName}-${reportDate.replace(/\//g, '-')}.pdf`,
    });

    return (
        <div className="p-5">
            <button
                onClick={() => toPDF()}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded mb-5"
            >
                Download PDF
            </button>

            <div ref={targetRef} className="bg-white p-10">
                {/* Header */}
                <header className="border-b-2 border-black pb-2 mb-5">
                    <div className="text-center">
                        <img
                            id="logo"
                            src={logoPestindo}
                            alt="logo pestindo"
                            className="w-80 mx-auto mb-5 object-left object-cover"
                        />
                        <p className="text-sm m-0">
                            Telp: 08111178822 • Website: www.pestindomu.com
                        </p>
                        <p className="text-sm m-0">
                            Jl. Raya Kalisuren, Tajurhalang, Kec. Tajur Halang, Kabupaten Bogor, Jawa Barat 13260
                        </p>
                    </div>
                </header>

                {/* Report Title */}
                <h3 className="text-center text-lg font-bold mb-8">LAPORAN REGULAR SERVICE</h3>

                {/* Meta Information */}
                <div className="mb-6">
                    <p><strong>Tanggal:</strong> {reportDate}</p>
                    <p><strong>Nama Pelanggan:</strong> {customerName}</p>
                    <p><strong>Teknisi:</strong> {technician}</p>
                    <p><strong>Jenis Pekerjaan:</strong> {jobType}</p>
                    <p><strong>Jenis Layanan:</strong> {serviceType}</p>
                </div>

                {/* Service Details */}
                <div>
                    <h4 className="font-bold mb-2">Detail Layanan per Lokasi</h4>
                    <table className="w-full border-collapse border border-black mb-5">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-2 text-left">Lokasi</th>
                                <th className="border border-black p-2 text-left">Hama & Jumlah</th>
                                <th className="border border-black p-2 text-left">Jenis Tindakan</th>
                                <th className="border border-black p-2 text-left">Peralatan Terpasang</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locationServices.map((service, index) => (
                                <React.Fragment key={index}>
                                    <tr>
                                        <td className="border border-black p-2 align-top" rowSpan={2}>
                                            {service.location}
                                        </td>
                                        <td className="border border-black p-2 align-top">
                                            <ul className="pl-4 m-0 list-disc">
                                                {service.pests.map((pest, i) => (
                                                    <li key={i}>
                                                        {pest.name} ({pest.code}) - {pest.count}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="border border-black p-2 align-top">
                                            <ul className="pl-4 m-0 list-disc">
                                                {service.actions.map((action, i) => (
                                                    <li key={i}>
                                                        {action.code} - {action.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="border border-black p-2 align-top">
                                            <ul className="pl-4 m-0 list-disc">
                                                {service.equipments.map((equipment, i) => (
                                                    <li key={i}>
                                                        {equipment.code} - {equipment.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 italic" colSpan={3}>
                                            Catatan: {service.notes}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {locationServices.map((service, index) => (
                    service.recommendations?.length > 0 && (
                        <div key={index} className="mb-6">
                            <h4 className="font-bold mb-2">Rekomendasi untuk {service.location}</h4>
                            {service.recommendations.map((rec, recIndex) => (
                                <div key={recIndex} className="mb-3">
                                    <p><strong>Catatan:</strong> {rec.notes}</p>
                                    <p><strong>Peralatan yang Direkomendasikan:</strong> {rec.equipmentCodes.join(', ')}</p>
                                </div>
                            ))}
                        </div>
                    )
                ))}

                {chemicals && chemicals.length > 0 && (
                    <div className="mb-6">
                        <h4 className="font-bold mb-2">Bahan Kimia yang Digunakan</h4>
                        <table className="w-full border-collapse border border-black mb-5">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-2 text-left">Nama Bahan Kimia</th>
                                    <th className="border border-black p-2 text-left">Takaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chemicals.map((chemical, index) => (
                                    <tr key={index}>
                                        <td className="border border-black p-2">{chemical.name}</td>
                                        <td className="border border-black p-2">{chemical.dosage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Documentation Photos */}
                {photos.length > 0 && (
                    <div className="mb-10">
                        <strong>Foto Dokumentasi:</strong>
                        <div className="flex flex-wrap mt-2">
                            {photos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo.url}
                                    alt={photo.alt}
                                    className="h-60 mr-2 mb-2 border border-gray-300"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Billing Total */}
                {totalAmount !== undefined && (
                    <div className="mb-8 mt-10 border-t-2 border-b-2 border-black py-4">
                        <h4 className="font-bold text-center text-xl mb-2">TOTAL TAGIHAN</h4>
                        <p className="text-center text-3xl font-bold">
                            {formatToRupiah(totalAmount)}
                        </p>
                    </div>
                )}

                {/* Signatures */}
                <div className="flex justify-between mt-12">
                    <div className="w-[45%] text-center">
                        <p>Teknisi</p>
                        <div className="h-20"></div>
                        <p>__________________________</p>
                        <p>{technician}</p>
                    </div>
                    <div className="w-[45%] text-center">
                        <p>PIC Pelanggan</p>
                        <div className="h-20"></div>
                        <p>__________________________</p>
                        {picCustomer}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegularServiceReport;