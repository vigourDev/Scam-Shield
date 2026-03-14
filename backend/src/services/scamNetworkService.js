import ScamNetwork from '../models/ScamNetwork.js';
import Identifier from '../models/Identifier.js';
import Report from '../models/Report.js';

class ScamNetworkService {
  /**
   * Build or update the scam network for an identifier
   */
  async buildScamNetwork(identifierId) {
    let network = await ScamNetwork.findOne({ identifierId });
    
    if (!network) {
      network = new ScamNetwork({ identifierId });
    }

    // Find all reports involving this identifier
    const reports = await Report.find({
      identifierId,
      status: 'verified'
    }).populate('identifierId');

    // Find identifiers that appear in the same reports
    const linkedIdentifierIds = await Report.distinct('identifierId', {
      _id: { $in: reports.map(r => r._id) },
      identifierId: { $ne: identifierId }
    });

    // Calculate link strength based on shared reports
    const linkedIdentifiersMap = new Map();

    for (const linkedId of linkedIdentifierIds) {
      // Count how many verified reports reference this linked identifier
      const sharedReportCount = await Report.countDocuments({
        identifierId: linkedId,
        status: 'verified'
      });

      const strength = reports.length > 0
        ? Math.min((sharedReportCount / reports.length) * 100, 100)
        : 0;

      linkedIdentifiersMap.set(linkedId.toString(), {
        identifier: linkedId,
        strength,
        sharedReports: []
      });
    }

    network.linkedIdentifiers = Array.from(linkedIdentifiersMap.values());
    network.networkSize = linkedIdentifiersMap.size + 1;
    network.lastUpdated = new Date();

    await network.save();
    return network;
  }

  /**
   * Find connected scam networks (multiple hops)
   */
  async findConnectedNetwork(identifierId, maxDepth = 3) {
    const visited = new Set();
    const network = new Map();

    const traverse = async (id, depth) => {
      if (depth === 0 || visited.has(id.toString())) return;
      
      visited.add(id.toString());
      const scamNetwork = await ScamNetwork.findOne({ identifierId: id })
        .populate('linkedIdentifiers.identifier');

      if (scamNetwork) {
        network.set(id.toString(), scamNetwork);
        
        for (const link of scamNetwork.linkedIdentifiers) {
          await traverse(link.identifier._id, depth - 1);
        }
      }
    };

    await traverse(identifierId, maxDepth);
    return network;
  }

  /**
   * Detect if two identifiers are in the same scam network
   */
  async areLinked(identifierId1, identifierId2) {
    const network = await this.findConnectedNetwork(identifierId1, 2);
    return network.has(identifierId2.toString());
  }

  /**
   * Auto-link identifiers from a new report
   */
  async linkIdentifiersFromReport(reportId) {
    const report = await Report.findById(reportId)
      .populate('identifierId');

    if (!report || !report.identifierId) return;

    // Find all other verified reports with same category or similar values
    const similarReports = await Report.find({
      category: report.category,
      status: 'verified',
      _id: { $ne: reportId }
    }).limit(10);

    if (similarReports.length > 0) {
      const linkedIds = similarReports
        .map(r => r.identifierId)
        .filter(id => id && !id.equals(report.identifierId._id));

      report.identifierId.linkedIdentifiers = [
        ...(report.identifierId.linkedIdentifiers || []),
        ...linkedIds
      ];
      await report.identifierId.save();

      // Update scam networks
      await this.buildScamNetwork(report.identifierId._id);
    }
  }
}

export default new ScamNetworkService();
